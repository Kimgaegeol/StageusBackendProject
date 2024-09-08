const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError"); // error 모듈
const tcWrapper = require("../module/tcWrapper"); // trycatch wrapper

const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const duplicateCheck = require("./../middleware/duplicateCheck");
const roleCheck = require("./../middleware/roleCheck");
const dataCheck = require("./../middleware/dataCheck");

const {nonNegativeNumberRegex, textMax50} = regex;
const {insertData, readData, updateData, deleteData} = dbHelper;
// 댓글 읽기
router.get("",
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ),
tcWrapper(
async (req,res) => {
    const { articleIdx } = req.query;

    const sql = "SELECT * FROM comment.list WHERE article_idx=$1";
    let rows = await readData(sql,[articleIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 게시글입니다.", 404);
    res.status(200).send({
        rows
    });
}));
// 댓글 생성
router.post("",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["content",textMax50] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { articleIdx } = req.query;
    const { content } = req.body;
    let sql;

    sql = "SELECT user_idx FROM article.list WHERE idx=$1"; 
    const rows = await readData(sql,[articleIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
    if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

    sql = "INSERT INTO comment.list(user_idx,article_idx,content) VALUES ($1,$2,$3)";
    await insertData(sql,[idx,articleIdx,content]);
    res.status(200).send({});
}));
// 댓글 수정
router.put("/:commentIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["commentIdx",nonNegativeNumberRegex],["content",textMax50] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { articleIdx } = req.query;
    const { commentIdx } = req.params;
    const { content } = req.body;
    let sql;

    sql = "SELECT user_idx FROM comment.list WHERE idx=$1";
    const rows = await readData(sql,[commentIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
    if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

    sql = "UPDATE comment.list SET content=$1 WHERE idx=$2 AND user_idx=$3 AND article_idx=$4";
    await updateData(sql,[content,commentIdx,idx,articleIdx]);
    res.status(200).send({});
}));
// 댓글 삭제
router.delete("/:commentIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["commentIdx",nonNegativeNumberRegex] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { articleIdx } = req.query;
    const { commentIdx } = req.params;
    let sql;

    sql = "SELECT user_idx FROM comment.list WHERE idx=$1";
    const rows = await readData(sql,[commentIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
    if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

    sql = "DELETE FROM comment.list WHERE idx=$1 AND user_idx=$2 AND article_idx=$3";
    await insertData(sql,[commentIdx,idx,articleIdx]);
    res.status(200).send({});
}));
// 댓글 좋아요 생성
router.post("/:commentIdx/like",
loginCheck,
regexCheck( [ ["commentIdx",nonNegativeNumberRegex] ] ),
dataCheck("SELECT * FROM comment.list WHERE idx=$1",["commentIdx"],"존재하지 않는 댓글입니다."),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { commentIdx } = req.params;
    let sql;

    sql = "SELECT idx FROM comment.like WHERE user_idx=$1 AND comment_idx=$2";
    let rows = await readData(sql,[idx,commentIdx]);
    if(rows.length > 0) throw customError("중복된 댓글 좋아요 입니다.", 409);

    sql = "INSERT INTO comment.like(user_idx,comment_idx) VALUES($1,$2)";
    await insertData(sql,[idx,commentIdx]);
    res.status(200).send({});
}));
// 댓글 좋아요 삭제
router.delete("/:commentIdx/like",
loginCheck,
regexCheck( [ ["commentIdx",nonNegativeNumberRegex] ] ),
dataCheck("SELECT * FROM comment.list WHERE idx=$1",["commentIdx"],"존재하지 않는 댓글입니다."),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { commentIdx } = req.params;
    let sql;

    sql = "SELECT idx FROM comment.like WHERE user_idx=$1 AND comment_idx=$2";
    let rows = await readData(sql,[idx,commentIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 좋아요 댓글입니다.", 404);

    sql = "DELETE FROM comment.like WHERE user_idx=$1 AND comment_idx=$2";
    await deleteData(sql,[idx,commentIdx]);
    res.status(200).send({});
}));

module.exports = router;