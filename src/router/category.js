const router = require("express").Router();

const client = require("./../config/postgresql");

const tcWrapper = require("../module/tcWrapper");

const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const duplicateCheck = require("./../middleware/duplicateCheck");
const roleCheck = require("./../middleware/roleCheck");
const dataCheck = require("./../middleware/dataCheck");

const regex = require("./../constant/regx");
const role = require("./../constant/role");

const { nonNegativeNumberRegex, textMax50 } = regex;
const { manager, staff, user } = role; // manager : 1, staff : 2, user : 3


//카테고리 목록 읽기
router.get("/all",
    tcWrapper(
        async (req, res, next) => {

            const sql = "SELECT * FROM article.category ORDER BY idx";
            const result = await client.query(sql, [])

            res.status(200).send({
                "data": result.rows
            });
        }));

//카테고리 생성 (관리자)
router.post("",
    loginCheck,
    roleCheck(manager),
    regexCheck([["categoryName", textMax50]]),
    duplicateCheck("SELECT idx FROM article.category WHERE name=$1", "categoryName", ["categoryName"]),
    tcWrapper(
        async (req, res, next) => {
            const { categoryName } = req.body;

            const sql = "INSERT INTO article.category(name) VALUES ($1)";
            await client.query(sql, [categoryName]);

            res.status(200).send({});
        }));

//카테고리 수정 (관리자)
router.put("/:categoryIdx",
    loginCheck,
    roleCheck(manager),
    regexCheck([["categoryIdx", nonNegativeNumberRegex], ["categoryName", textMax50]]),
    dataCheck("SELECT name FROM article.category WHERE idx=$1", ["categoryIdx"], "존재하지 않는 카테고리입니다."),
    duplicateCheck("SELECT idx FROM article.category WHERE name=$1", "categoryName", ["categoryName"]),
    tcWrapper(
        async (req, res, next) => {
            const { categoryIdx } = req.params;
            const { categoryName } = req.body;

            const sql = "UPDATE article.category SET name=$1 WHERE idx=$2";
            await client.query(sql, [categoryName, categoryIdx])

            res.status(200).send({});
        }));

//카테고리 삭제 (관리자)
router.delete("/:categoryIdx",
    loginCheck,
    roleCheck(manager),
    regexCheck([["categoryIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT name FROM article.category WHERE idx=$1", ["categoryIdx"], "존재하지 않는 카테고리입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { categoryIdx } = req.params;

            const sql = "DELETE FROM article.category WHERE idx=$1";
            await client.query(sql, [categoryIdx])

            res.status(200).send({});
        }));

module.exports = router;