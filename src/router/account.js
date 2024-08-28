const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const error = require("./../module/customError"); // error 모듈

const regexCheck = require("./../middleware/regexCheck");
const loginCheck = require("./../middleware/loginCheck");
const duplicateCheck = require("./../middleware/duplicateCheck");

const { idRegex, pwRegex, nameRegex, phoneRegex, nonNegativeNumberRegex } = regex;
const { insertData, readData, updateData, deleteData } = dbHelper;
const { customError, errorLogic } = error;


//로그인
router.post("/login", regexCheck( [ ["id", idRegex],["pw", pwRegex] ] ),
async (req,res) => {
    const { id, pw } = req.body;
    try {
        let sql = "SELECT idx, grade_idx, name From account WHERE id = ? AND pw = ?";
        let rows = await readData(sql,[id,pw]);
        if(rows.length != 1) throw customError("존재하지 않는 데이터", 404);

        const idx = rows[0].idx;
        const gradeIdx = rows[0].grade_idx;
        const name = rows[0].name;

        req.session.user = {
            idx: idx,
            gradeIdx: gradeIdx
        };

        res.status(200).send({ //값을 주고 싶다면 다 session으로 줘야 함
            // "name" : name
        });
    } catch (e) {
        errorLogic(res,e);
    }
});
//로그아웃
router.delete("/logout",(req,res) => {
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        req.session.destroy();
        res.status(200).send({});
    } catch (e) {
        errorLogic(res,e);
    }
});
//계정생성
router.post("/user", regexCheck( [ ["id", idRegex],["pw", pwRegex],["name", nameRegex],["phone", phoneRegex] ] ),
duplicateCheck( "SELECT idx FROM account WHERE id = ?","id",["id"] ),
duplicateCheck( "SELECT idx FROM account WHERE phone = ?","phone",["phone"] ),
async (req,res) => {
    const { id, pw, name, phone } = req.body;
    try {
        let sql = "INSERT INTO account(grade_idx,id,pw,name,phone) VALUES (?,?,?,?,?)"; //grade_idx는 일단 3로 넣을 것 (1:최종 관리자, 2:중간 관리자, 3:사용자)
        await insertData(sql,[3,id,pw,name,phone]);
        res.status(200).send({});
    } catch (e) {
        errorLogic(res,e);
    }
});
//계정읽기
router.get("/user",async (req,res) => {
    const pw = req.body.pw;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
        if(!pwRegex.test(pw)) throw customError("pw", 400);

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
        errorLogic(res,e);
    }
});
//계정수정
router.put("/user",async (req,res) => {
    const { id, pw, changePw, name, phone } = req.body;
    let sql;
    let rows;
    try{
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!idRegex.test(id)) throw customError("id", 400);
        if(!pwRegex.test(pw)) throw customError("pw", 400);
        if(!pwRegex.test(changePw)) throw customError("changePw", 400);
        if(!nameRegex.test(name)) throw customError("name", 400);
        if(!phoneRegex.test(phone)) throw customError("phone", 400);

        sql = "SELECT pw FROM account WHERE idx = ?";
        rows = await readData(sql,[idx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].pw != pw) throw customError("잘못된 접근", 403);
    
        sql = "SELECT idx FROM account WHERE id = ?";
        rows = await readData(sql,[id]);
        if(rows.length > 0) throw customError("id", 409)
    
        sql = "SELECT idx FROM account WHERE phone = ?";
        rows = await readData(sql,[phone]);
        if(rows.length > 0) throw customError("phone", 409);

        sql = "UPDATE account SET id = ?, pw = ?, name = ?, phone = ? WHERE idx = ?";
        await updateData(sql,[id,changePw,name,phone,idx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
})
//grade_idx 수정 (관리자)
router.put("/user/grade",async (req,res)=> {
    const { userIdx, userGradeIdx } = req.body;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const gradeIdx  = req.session.user.gradeIdx;

        if(!nonNegativeNumberRegex.test(userIdx)) throw customError("userIdx", 400);
        if(!nonNegativeNumberRegex.test(userGradeIdx)) throw customError("userGradeIdx", 400);

        if(gradeIdx != 1) throw customError("잘못된 접근", 403);

        let sql = "UPDATE account SET grade_idx = ? WHERE idx = ?";
        await updateData(sql,[userGradeIdx,userIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
})
//계정삭제
router.delete("/user",async (req,res) => {
    const pw = req.body.pw;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!pwRegex.test(pw)) throw customError("pw", 400);

        sql = "SELECT pw FROM account WHERE idx = ?";
        let rows = await readData(sql,[idx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].pw != pw) throw customError("잘못된 접근", 403);

        sql = "DELETE FROM account WHERE idx = ? AND pw = ?";
        await deleteData(sql,[idx,pw]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
//아이디 찾기
router.get("/user/id",async (req,res) => {
    const phone = req.body.phone;
    try {
        if(!phoneRegex.test(phone)) throw customError("phone", 400);
        let sql = "SELECT id FROM account WHERE phone = ?";
        let rows = await readData(sql,[phone]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        res.status(200).send({
            "id": rows[0].id
        });
    } catch(e) {
        errorLogic(res,e);
    }
});
//비밀번호 찾기
router.get("/user/pw",async (req,res) => {
    const { id, phone } = req.body;
    try {
        if(!idRegex.test(id)) throw customError("phone", 400);
        if(!phoneRegex.test(phone)) throw customError("phone", 400);
        let sql = "SELECT pw FROM account WHERE id =? AND phone = ?";
        let rows = await readData(sql,[id,phone]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        res.status(200).send({
            "pw": rows[0].pw
        });
    } catch(e) {
        errorLogic(res,e);
    }
});

module.exports = router;
