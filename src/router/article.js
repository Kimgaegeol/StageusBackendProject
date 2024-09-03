const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError"); // error 모듈
const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const dataCheck = require("./../middleware/dataCheck");

const { nonNegativeNumberRegex, textMax50, textMax1000 } = regex;
const { insertData, readData, updateData, deleteData } = dbHelper;

//카테고리별 게시글읽기 -> query로 쓰는 걸로 바꾸자 (categoryIdx),
router.get("/all",
regexCheck( [ ["categoryIdx", nonNegativeNumberRegex] ] ),
dataCheck( "SELECT name FROM category WHERE idx = ?",["categoryIdx"],"존재하지 않는 카테고리입니다." ),
async (req,res, next) => {
    try {
        const categoryIdx = req.query.categoryIdx;
        const sql = "SELECT account.name, article.idx, article.user_idx, article.category_idx, article.title FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.category_idx = ?";
        const rows = await readData(sql,[categoryIdx]);
        res.status(200).send({
            rows
        });
    } catch(e) {
        next(e);
    }
});
//게시글 생성
router.post("",
loginCheck,
regexCheck( [ ["categoryIdx",nonNegativeNumberRegex],["title",textMax50],["content",textMax1000] ] ),
dataCheck("SELECT name FROM category WHERE idx = ?",["categoryIdx"],"존재하지 않는 카테고리입니다."),
async (req,res, next) => {
    try {
        const categoryIdx = req.query.categoryIdx;
        const { title, content } = req.body;
        const idx = req.session.user.idx;

        const sql = "INSERT INTO article(user_idx,category_idx,title,content) VALUES (?,?,?,?)";
        await insertData(sql,[idx,categoryIdx,title,content]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
//게시글 읽기
router.get("/:articleIdx",
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ), // db통신 두번 할 필요 없어서 dataCheck 생략
async (req,res, next) => {
    try {
        const articleIdx = req.params.articleIdx;
        let sql = "SELECT account.name, article.*, COUNT(*) like_count FROM article INNER JOIN account ON article.user_idx = account.idx INNER JOIN like_article ON article.idx = like_article.article_idx WHERE article.idx = ?";
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
    } catch(e) {
        next(e);
    }
});
//게시글 수정
router.put("/:articleIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["title",textMax50],["content",textMax1000] ] ),
async (req,res, next) => {
    try {
        const idx = req.session.user.idx;
        const articleIdx = req.params.articleIdx;
        const { title, content } = req.body;
        let sql;
    
        sql = "SELECT user_idx FROM article WHERE idx = ?"; // "잘못된 접근도 체크해야 하기 떄문에 여기서 함"
        const rows = await readData(sql,[articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 게시물입니다.", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "UPDATE article SET title = ?, content = ? WHERE idx = ? AND user_idx = ?";
        await updateData(sql,[title,content,articleIdx,idx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
//게시글 삭제
router.delete("/:articleIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ),
async (req,res, next) => {
    try {
        const idx = req.session.user.idx;
        const articleIdx = req.params.articleIdx;
        let sql;
    
        sql = "SELECT user_idx FROM article WHERE idx = ?";
        let rows = await readData(sql,[articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "DELETE FROM article WHERE idx = ? AND user_idx = ?";
        await deleteData(sql,[articleIdx,idx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
//게시글 검색
router.get("/all/search",
regexCheck( [ ["categoryIdx",nonNegativeNumberRegex],["searchText",textMax50] ] ),
dataCheck("SELECT name FROM category WHERE idx = ?",["categoryIdx"],"존재하지 않는 카테고리입니다."),
async (req,res, next) => {
    try {
        const categoryIdx = req.query.categoryIdx;
        const searchText = req.body.searchText;

        const sql = "SELECT account.name, article.idx, article.user_idx, article.category_idx, article.title FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.title LIKE ? OR article.content LIKE ? AND article.category_idx = ?";
        const rows = await readData(sql,[searchText,searchText,categoryIdx]);
        res.status(200).send({
            rows
        });
    } catch(e) {
        next(e);
    }
});
//게시글 좋아요 생성
router.post("/:articleIdx/like",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ),
async (req,res, next) => {
    try {
        const idx = req.session.user.idx;
        const articleIdx = req.params.articleIdx;
        let sql;
        //session에 있는 건 중복검사 미들웨어가 해결 못함....나중에 해결해보자
        sql = "SELECT idx FROM like_article WHERE user_idx = ? AND article_idx = ?";
        const rows = await readData(sql,[idx,articleIdx]);
        if(rows.length > 0) throw customError("이미 좋아요가 있음", 409);

        sql = "INSERT INTO like_article(user_idx,article_idx) VALUES(?,?)";
        await insertData(sql,[idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
//게시글 좋아요 삭제
router.delete("/:articleIdx/like",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex] ] ),
async (req,res, next) => {
    try {
        const idx = req.session.user.idx;
        const articleIdx = req.params.articleIdx;
        let sql;
        // dataCheck도 session 넣어서 해야 할 듯...
        sql = "SELECT idx FROM like_article WHERE user_idx = ? AND article_idx = ?";
        const rows = await readData(sql,[idx,articleIdx]);
        if(rows.length == 0) throw customError("좋아요가 존재하지 않습니다.", 404);

        sql = "DELETE FROM like_article WHERE user_idx = ? AND article_idx = ?";
        await deleteData(sql,[idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});

module.exports = router;