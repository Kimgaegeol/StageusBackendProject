const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError"); // error 모듈
const tcWrapper = require("../module/tcWrapper"); // trycatch wrapper

const regexCheck = require("./../middleware/regexCheck"); // 정규포현식체크 미들웨어
const loginCheck = require("./../middleware/loginCheck");// 로그인체크 미들웨어
const duplicateCheck = require("./../middleware/duplicateCheck");// 중복체크 미들웨어
const roleCheck = require("./../middleware/roleCheck"); // 관리자 권한체크 미들웨어

const { idRegex, pwRegex, nameRegex, phoneRegex, nonNegativeNumberRegex } = regex;
const { insertData, readData, updateData, deleteData } = dbHelper;

//로그인 (dataCheckMiddleware를 쓰지 않는 이유 : 굳이 2번 db통신을 할 필요는 없다.)
router.post("/login",
regexCheck( [ ["id", idRegex],["pw", pwRegex] ] ),
tcWrapper(
async (req,res) => {
        const { id, pw } = req.body;

        const sql = "SELECT idx,grade_idx,name From account.list WHERE id=$1 AND pw=$2";
        const rows = await readData(sql,[id,pw]);
        if(rows.length == 0) throw customError("존재하지 않는 유저 입니다.", 404);

        const idx = rows[0].idx;
        const gradeIdx = rows[0].grade_idx;
        const name = rows[0].name;

        req.session.user = {
            idx: idx,
            gradeIdx: gradeIdx,
            name: name
        };

            res.status(200).send({});
}));
//로그아웃
router.delete("/logout",
loginCheck,
tcWrapper(
(req,res) => {
    req.session.destroy();
    res.status(200).send({});
}));
//계정생성
router.post("/user",
regexCheck( [ ["id", idRegex],["pw", pwRegex],["name", nameRegex],["phone", phoneRegex] ] ),
duplicateCheck( "SELECT idx FROM account.list WHERE id=$1","id",["id"] ),
duplicateCheck( "SELECT idx FROM account.list WHERE phone=$1","phone",["phone"] ),
tcWrapper(
async (req,res) => {
const { id, pw, name, phone } = req.body;

const sql = "INSERT INTO account.list(grade_idx,id,pw,name,phone) VALUES ($1,$2,$3,$4,$5)"; //grade_idx는 일단 3로 넣을 것 (1:최종 관리자, 2:중간 관리자, 3:사용자)
await insertData(sql,[3,id,pw,name,phone]);
res.status(200).send({});
}));
//계정읽기
router.get("/user",
loginCheck,
regexCheck( [ ["pw", pwRegex] ] ),
tcWrapper(
async (req,res) => {
    const { pw } = req.body;
    const { idx } = req.session.user;

    const sql = "SELECT id,pw,name,phone FROM account.list WHERE idx=$1 AND pw=$2";
    const rows = await readData(sql,[idx,pw]);
    if(rows.length == 0) throw customError("잘못된 접근", 403);
    res.status(200).send({
        "id": rows[0].id,
        "pw": rows[0].pw,
        "name": rows[0].name,
        "phone": rows[0].phone
    });
}));
//계정수정
router.put("/user",
loginCheck,
regexCheck( [ ["id", idRegex],["pw", pwRegex],["changePw", pwRegex],["name", nameRegex],["phone", phoneRegex] ] ),
duplicateCheck( "SELECT idx FROM account.list WHERE id=$1","id",["id"] ),
duplicateCheck( "SELECT idx FROM account.list WHERE phone=$1","phone",["phone"] ),
tcWrapper(
async (req,res) => {
    const { id, pw, changePw, name, phone } = req.body;
    const { idx } = req.session.user;

    sql = "SELECT pw FROM account.list WHERE idx=$1";
    const rows = await readData(sql,[idx]);
    if(rows[0].pw != pw) throw customError("잘못된 접근", 403);

    sql = "UPDATE account.list SET id=$1, pw=$2, name=$3, phone=$4 WHERE idx=$5";
    await updateData(sql,[id,changePw,name,phone,idx]);
    req.session.destroy();
    res.status(200).send({});
}));
//grade_idx 수정 (관리자)
router.put("/user/grade",
loginCheck,
roleCheck,
regexCheck( [ ["userIdx",nonNegativeNumberRegex],["userGradeIdx",nonNegativeNumberRegex] ] ),
tcWrapper(
async (req,res) => {
    const { userIdx, userGradeIdx } = req.body;

    let sql = "UPDATE account.list SET grade_idx=$1 WHERE idx=$2";
    await updateData(sql,[userGradeIdx,userIdx]); //여기 dataCheck 미들웨어 들어가는 게 맞음
    res.status(200).send({});
}));
//계정삭제
router.delete("/user",
loginCheck,
regexCheck( [ ["pw", pwRegex] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { pw } = req.body;
    let sql;

    sql = "SELECT pw FROM account.list WHERE idx=$1";
    const rows = await readData(sql,[idx]);
    if(rows[0].pw != pw) throw customError("잘못된 접근", 403);

    sql = "DELETE FROM account.list WHERE idx=$1 AND pw=$2";
    await deleteData(sql,[idx,pw]);
    req.session.destroy();
    res.status(200).send({});
}));
//아이디 찾기
router.get("/user/id",
regexCheck( [ ["phone", phoneRegex] ] ),
tcWrapper(
async (req,res) => {
    const { phone } = req.body;

    const sql = "SELECT id FROM account.list WHERE phone=$1";
    const rows = await readData(sql,[phone]);
    if(rows.length == 0) throw customError("알맞은 id가 존재하지 않습니다.", 404);
    res.status(200).send({
        "id": rows[0].id
    });
}));
//비밀번호 찾기
router.get("/user/pw",
regexCheck( [ ["id", idRegex],["phone", phoneRegex] ] ),
tcWrapper(
async (req,res) => {
    const { id, phone } = req.body;

    const sql = "SELECT pw FROM account.list WHERE id=$1 AND phone=$2";
    const rows = await readData(sql,[id,phone]);
    if(rows.length == 0) throw customError("알맞은 pw가 존재하지 않습니다.", 404);
    res.status(200).send({
        "pw": rows[0].pw
    });
}));

module.exports = router;