const router = require("express").Router(); // express 모듈
const session = require("express-session"); // session 모듈
const regex = require("./../constant/regx"); // regex 모듈
const data = require("./../constant/data"); // data 모듈
const error = require("./../constant/error"); // error 모듈

const { nonNegativeNumberRegex, textMax50 } = regex;
const { insertData, readData, updateData, deleteData } = data;
const { customError, errorLogic } = error;

//세션 설정 (저장되는 값 : idx, grade_idx)
router.use(session({
    secret: "my-secret-key", //세션 암호화를 위한 비밀키
    resave: false, // 세션이 변경되지 않아도 저장할지 여부
    saveUninitialized: false, // 초기화되지 않은 세션을 저장할지 여부
    cookie: { maxAge: 60000 } // 만료 시간 (밀리초 단위)
}));


//카테고리 목록 읽기
router.get("/all",async (req,res) => {
    try {
        let sql = "SELECT * FROM category ORDER BY idx";
        let rows = await readData(sql);
        res.status(200).send({
            rows
        });
    } catch(e) {
        errorLogic(res,e);
    }
});
//카테고리 생성 (관리자)
router.post("",async (req,res) => {
    const categoryName = req.body.categoryName;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const gradeIdx  = req.session.user.gradeIdx;

        if(!textMax50.test(categoryName)) throw customError("categoryName", 400);

        if(gradeIdx != 1) throw customError("잘못된 접근", 403);

        sql = "SELECT idx FROM category WHERE name = ?";
        let rows = await readData(sql,[categoryName]);
        if(rows.length > 0) throw customError("categoryName", 409)

        sql = "INSERT INTO category(name) VALUES (?)";
        await insertData(sql,[categoryName]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
//카테고리 수정 (관리자)
router.put("/:categoryIdx",async (req,res) => {
    const categoryIdx = req.params.categoryIdx;
    const categoryName = req.body.categoryName;
    let sql;
    let rows;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const gradeIdx  = req.session.user.gradeIdx;

        if(!nonNegativeNumberRegex.test(categoryIdx)) throw customError("categoryIdx", 400);
        if(!textMax50.test(categoryName)) throw customError("categoryName", 400);

        if(gradeIdx != 1) throw customError("잘못된 접근", 403);

        sql = "SELECT name FROM category WHERE idx = ?";
        rows = await readData(sql,[categoryIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "SELECT idx FROM category WHERE name = ?";
        rows = await readData(sql,[categoryName]);
        if(rows.length > 0) throw customError("categoryName", 409);

        sql = "UPDATE category SET name = ? WHERE idx = ?";
        await updateData(sql,[categoryName,categoryIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
//카테고리 삭제 (관리자)
router.delete("/:categoryIdx",async (req,res) => {
    const categoryIdx = req.params.categoryIdx;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const gradeIdx  = req.session.user.gradeIdx;

        if(!nonNegativeNumberRegex.test(categoryIdx)) throw customError("categoryIdx", 400);

        if(gradeIdx != 1) throw customError("잘못된 접근", 403);

        sql = "SELECT name FROM category WHERE idx = ?";
        let rows = await readData(sql,[categoryIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "DELETE FROM category WHERE idx = ?";
        await deleteData(sql,[categoryIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});

module.exports = router;