const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError"); // error 모듈
const regexCheck = require("./../middleware/regexCheck"); // 정규포현식체크 미들웨어
const loginCheck = require("./../middleware/loginCheck");// 로그인체크 미들웨어
const duplicateCheck = require("./../middleware/duplicateCheck");// 중복체크 미들웨어

const { idRegex, pwRegex, nameRegex, phoneRegex, nonNegativeNumberRegex } = regex;
const { insertData, readData, updateData, deleteData } = dbHelper;


//로그인
router.post("/login",
regexCheck( [ ["id", idRegex],["pw", pwRegex] ] ),
async (req,res, next) => {
    const { id, pw } = req.body;
    try {
        let sql = "SELECT idx, grade_idx, name From account WHERE id = ? AND pw = ?";
        let rows = await readData(sql,[id,pw]);
        if(rows.length != 1) throw customError("존재하지 않는 유저 입니다.", 404);

        const idx = rows[0].idx;
        const gradeIdx = rows[0].grade_idx;
        const name = rows[0].name;

        req.session.user = {
            idx: idx,
            gradeIdx: gradeIdx,
            name: name
        };

        res.status(200).send({});
    } catch (e) {
        next(e);
    }
}
);
//로그아웃
router.delete("/logout",
loginCheck,
(req,res) => {
    try {
        req.session.destroy();
        res.status(200).send({});
    } catch (e) {
        next(e);
    }
});
//계정생성
router.post("/user",
regexCheck( [ ["id", idRegex],["pw", pwRegex],["name", nameRegex],["phone", phoneRegex] ] ),
duplicateCheck( "SELECT idx FROM account WHERE id = ?","id",["id"] ),
duplicateCheck( "SELECT idx FROM account WHERE phone = ?","phone",["phone"] ),
async (req,res) => {
    const { id, pw, name, phone } = req.body;
    try {
        let sql = "INSERT INTO account(grade_idx,id,pw,name,phone) VALUES (?,?,?,?,?)"; //grade_idx는 일단 3로 넣을 것 (1:최종 관리자, 2:중간 관리자, 3:사용자)
        await insertData(sql,[3,id,pw,name,phone]);
        res.status(200).send({});
    } catch (e) {
        next(e);
    }
});
//계정읽기
router.get("/user",
loginCheck,
regexCheck( [ ["pw", pwRegex] ] ),
async (req,res) => {
    const pw = req.body.pw;
    try {
        const idx = req.session.user.idx;

        let sql = "SELECT id,pw,name,phone FROM account WHERE idx =? AND pw = ?";
        let rows = await readData(sql,[idx,pw]);
        if(rows.length == 0) throw customError("잘못된 접근", 403);
        res.status(200).send({
            "id": rows[0].id,
            "pw": rows[0].pw,
            "name": rows[0].name,
            "phone": rows[0].phone
        });
        
    } catch (e) {
        next(e);
    }
});
//계정수정
router.put("/user",
loginCheck,
regexCheck( [ ["id", idRegex],["pw", pwRegex],["changePw", pwRegex],["name", nameRegex],["phone", phoneRegex] ] ),
duplicateCheck( "SELECT idx FROM account WHERE id = ?","id",["id"] ),
duplicateCheck( "SELECT idx FROM account WHERE phone = ?","phone",["phone"] ),
async (req,res) => {
    const { id, pw, changePw, name, phone } = req.body;
    let sql;
    let rows;
    try{
        const idx = req.session.user.idx;

        sql = "SELECT pw FROM account WHERE idx = ?";
        rows = await readData(sql,[idx]);
        if(rows[0].pw != pw) throw customError("잘못된 접근", 403);

        sql = "UPDATE account SET id = ?, pw = ?, name = ?, phone = ? WHERE idx = ?";
        await updateData(sql,[id,changePw,name,phone,idx]);
        req.session.destroy();
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
})
//grade_idx 수정 (관리자)
router.put("/user/grade",
loginCheck,
regexCheck( [ ["userIdx",nonNegativeNumberRegex],["userGradeIdx",nonNegativeNumberRegex] ] ),
async (req,res)=> {
    const { userIdx, userGradeIdx } = req.body;
    try {
        const gradeIdx  = req.session.user.gradeIdx;

        if(gradeIdx != 1) throw customError("잘못된 접근", 403);

        let sql = "UPDATE account SET grade_idx = ? WHERE idx = ?";
        await updateData(sql,[userGradeIdx,userIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
})
//계정삭제
router.delete("/user",
loginCheck,
regexCheck( [ ["pw", pwRegex] ] ),
async (req,res) => {
    const pw = req.body.pw;
    let sql;
    try {
        const idx = req.session.user.idx;
    
        sql = "SELECT pw FROM account WHERE idx = ?";
        let rows = await readData(sql,[idx]);
        if(rows[0].pw != pw) throw customError("잘못된 접근", 403);

        sql = "DELETE FROM account WHERE idx = ? AND pw = ?";
        await deleteData(sql,[idx,pw]);
        req.session.destroy();
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
//아이디 찾기
router.get("/user/id",
regexCheck( [ ["phone", phoneRegex] ] ),
async (req,res) => {
    const phone = req.body.phone;
    try {
        let sql = "SELECT id FROM account WHERE phone = ?";
        let rows = await readData(sql,[phone]);
        if(rows.length == 0) throw customError("알맞은 id가 존재하지 않습니다.", 404);
        res.status(200).send({
            "id": rows[0].id
        });
    } catch(e) {
        next(e);
    }
});
//비밀번호 찾기
router.get("/user/pw",
regexCheck( [ ["id", idRegex],["phone", phoneRegex] ] ),
async (req,res) => {
    const { id, phone } = req.body;
    try {
        let sql = "SELECT pw FROM account WHERE id =? AND phone = ?";
        let rows = await readData(sql,[id,phone]);
        if(rows.length == 0) throw customError("알맞은 pw가 존재하지 않습니다.", 404);
        res.status(200).send({
            "pw": rows[0].pw
        });
    } catch(e) {
        next(e);
    }
});

module.exports = router;
