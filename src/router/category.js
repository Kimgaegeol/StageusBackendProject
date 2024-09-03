const router = require("express").Router();
const regex = require("./../constant/regx");
const dbHelper = require("./../module/dbHelper");
const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const duplicateCheck = require("./../middleware/duplicateCheck");
const roleCheck = require("./../middleware/roleCheck");
const dataCheck = require("./../middleware/dataCheck");

const { nonNegativeNumberRegex, textMax50 } = regex;
const { insertData, readData, updateData, deleteData } = dbHelper;

//카테고리 목록 읽기
router.get("/all",
async (req,res, next) => {
    try {
        const sql = "SELECT * FROM category ORDER BY idx";
        const rows = await readData(sql);
        res.status(200).send({
            rows
        });
    } catch(e) {
        next(e);
    }
});
//카테고리 생성 (관리자)
router.post("",
loginCheck,
roleCheck,
regexCheck( [ ["categoryName", textMax50] ] ),
async (req,res, next) => {
    try {
        const categoryName = req.body.categoryName;

        const sql = "INSERT INTO category(name) VALUES (?)";
        await insertData(sql,[categoryName]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
//카테고리 수정 (관리자)
router.put("/:categoryIdx",
loginCheck,
roleCheck,
regexCheck( [ ["categoryIdx", nonNegativeNumberRegex],["categoryName", textMax50] ] ),
dataCheck( "SELECT name FROM category WHERE idx = ?",["categoryIdx"],"존재하지 않는 카테고리입니다." ),
duplicateCheck( "SELECT idx FROM category WHERE name = ?","categoryIdx",["categoryName"] ),
async (req,res, next) => {
    try {
        const categoryIdx = req.params.categoryIdx;
        const categoryName = req.body.categoryName;

        const sql = "UPDATE category SET name = ? WHERE idx = ?";
        await updateData(sql,[categoryName,categoryIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
//카테고리 삭제 (관리자)
router.delete("/:categoryIdx",
loginCheck,
roleCheck,
regexCheck( [ ["categoryIdx", nonNegativeNumberRegex] ] ),
dataCheck( "SELECT name FROM category WHERE idx = ?",["categoryIdx"],"존재하지 않는 카테고리입니다." ),
async (req,res, next) => {
    try {
        const categoryIdx = req.params.categoryIdx;

        const sql = "DELETE FROM category WHERE idx = ?";
        await deleteData(sql,[categoryIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});

module.exports = router;