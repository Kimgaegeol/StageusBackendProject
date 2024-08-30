const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError"); // error 모듈

const { nonNegativeNumberRegex, textMax50 } = regex;
const { insertData, readData, updateData, deleteData } = dbHelper;

//카테고리 목록 읽기
router.get("/all",async (req,res) => {
    try {
        let sql = "SELECT * FROM category ORDER BY idx";
        let rows = await readData(sql);
        res.status(200).send({
            rows
        });
    } catch(e) {
        next(e);
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
        next(e);
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
        next(e);
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
        next(e);
    }
});

module.exports = router;