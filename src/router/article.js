const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError"); // error 모듈
const tcWrapper = require("../module/tcWrapper"); // trycatch wrapper

const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const dataCheck = require("./../middleware/dataCheck");

const { nonNegativeNumberRegex, textMax50, textMax1000 } = regex;
const { insertData, readData, updateData, deleteData } = dbHelper;

//카테고리별 게시글읽기 -> query로 쓰는 걸로 바꾸자 (categoryIdx),
router.get("/all",
regexCheck( [ ["categoryIdx", nonNegativeNumberRegex] ] ),
dataCheck( "SELECT name FROM category.list WHERE idx=$1",["categoryIdx"],"존재하지 않는 카테고리입니다." ),
tcWrapper(
async (req,res) => {
    const { categoryIdx } = req.query;
    const sql = "SELECT account.list.name, article.list.idx, article.list.user_idx, article.list.category_idx, article.list.title FROM article.list INNER JOIN account.list ON article.list.user_idx = account.list.idx WHERE article.list.category_idx=$1";
    const rows = await readData(sql,[categoryIdx]);
    res.status(200).send({
        rows
    });
}));
//게시글 생성
router.post("",
loginCheck,
regexCheck( [ ["categoryIdx",nonNegativeNumberRegex],["title",textMax50],["content",textMax1000] ] ),
dataCheck("SELECT name FROM category.list WHERE idx=$1",["categoryIdx"],"존재하지 않는 카테고리입니다."),
tcWrapper(
async (req,res) => {
    const { categoryIdx } = req.query;
    const { title, content } = req.body;
    const { idx } = req.session.user;

    const sql = "INSERT INTO article.list(user_idx,category_idx,title,content) VALUES ($1,$2,$3,$4)";
    await insertData(sql,[idx,categoryIdx,title,content]);
    res.status(200).send({});
}));
//게시글 읽기
router.get("/:articleIdx",
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ), // db통신 두번 할 필요 없어서 dataCheck 생략
tcWrapper(
async (req,res) => {
    const { articleIdx } = req.params;
    let sql = "SELECT account.list.name, article.list.*, COUNT(*) like_count FROM article.list INNER JOIN account.list ON article.list.user_idx = account.list.idx INNER JOIN article.like ON article.list.idx = article.like.article_idx WHERE article.idx=$1";
    let rows = await readData(sql,[articleIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 게시글입니다.", 404);
    // BigInt 필드가 있는 경우 문자열로 변환
    rows = rows.map(row => {
        return {
            ...row,
            like_count: row.like_count.toString()  // BigInt를 문자열로 변환
        };
    });
    res.status(200).send({
        rows
    });
}));
//게시글 수정
router.put("/:articleIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["title",textMax50],["content",textMax1000] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { articleIdx } = req.params;
    const { title, content } = req.body;
    let sql;

    sql = "SELECT user_idx FROM article.list WHERE idx=$1"; // "잘못된 접근도 체크해야 하기 떄문에 여기서 함"
    const rows = await readData(sql,[articleIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 게시물입니다.", 404);
    if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

    sql = "UPDATE article.list SET title=$1, content=$2 WHERE idx=$3";
    await updateData(sql,[title,content,articleIdx]);
    res.status(200).send({});
}));
//게시글 삭제
router.delete("/:articleIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { articleIdx } = req.params;
    let sql;

    sql = "SELECT user_idx FROM article.list WHERE idx=$1";
    let rows = await readData(sql,[articleIdx]);
    if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
    if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

    sql = "DELETE FROM article.list WHERE idx=$1";
    await deleteData(sql,[articleIdx]);
    res.status(200).send({});
}));
//게시글 검색
router.get("/all/search",
regexCheck( [ ["categoryIdx",nonNegativeNumberRegex],["searchText",textMax50] ] ),
dataCheck("SELECT name FROM category WHERE idx = ?",["categoryIdx"],"존재하지 않는 카테고리입니다."),
tcWrapper(
async (req,res) => {
    const { categoryIdx } = req.query;
    const { searchText } = req.body;

    const sql = "SELECT account.list.name, article.list.idx, article.list.user_idx, article.list.category_idx, article.list.title FROM article.list INNER JOIN account.list ON article.list.user_idx = account.list.idx WHERE article.list.title LIKE $1 OR article.list.content LIKE $2 AND article.list.category_idx=$3";
    const rows = await readData(sql,[searchText,searchText,categoryIdx]);
    res.status(200).send({
        rows
    });
}));
//게시글 좋아요 생성
router.post("/:articleIdx/like",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { articleIdx } = req.params;
    let sql;
    //session에 있는 건 중복검사 미들웨어가 해결 못함....나중에 해결해보자
    sql = "SELECT idx FROM article.like WHERE user_idx=$1 AND article_idx=$2";
    const rows = await readData(sql,[idx,articleIdx]);
    if(rows.length > 0) throw customError("이미 좋아요가 있음", 409);

    sql = "INSERT INTO article.like(user_idx,article_idx) VALUES($1,$2)";
    await insertData(sql,[idx,articleIdx]);
    res.status(200).send({});
}));
//게시글 좋아요 삭제
router.delete("/:articleIdx/like",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ),
tcWrapper(
async (req,res) => {
    const { idx } = req.session.user;
    const { articleIdx } = req.params;
    let sql;
    // dataCheck도 session 넣어서 해야 할 듯...
    sql = "SELECT idx FROM article.like WHERE user_idx=$1 AND article_idx=$2";
    const rows = await readData(sql,[idx,articleIdx]);
    if(rows.length == 0) throw customError("좋아요가 존재하지 않습니다.", 404);

    sql = "DELETE FROM article.like WHERE user_idx=$1 AND article_idx=$2";
    await deleteData(sql,[idx,articleIdx]);
    res.status(200).send({});
}));

module.exports = router;