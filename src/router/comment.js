const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError"); // error 모듈
const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const duplicateCheck = require("./../middleware/duplicateCheck");
const roleCheck = require("./../middleware/roleCheck");
const dataCheck = require("./../middleware/dataCheck");

const {nonNegativeNumberRegex, textMax50} = regex;
const {insertData, readData, updateData, deleteData} = dbHelper;

router.post("",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["content",textMax50] ] ),
async (req,res) => { //댓글 생성
    try {
        const idx = req.session.user.idx;
        const articleIdx = req.query.articleIdx;
        const content = req.body.content
        let sql;

        sql = "SELECT user_idx FROM article WHERE idx = ?"; 
        const rows = await readData(sql,[articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "INSERT INTO comment(user_idx,article_idx,content) VALUES (?,?,?)";
        await insertData(sql,[idx,articleIdx,content]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
router.put("/:commentIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["commentIdx",nonNegativeNumberRegex],["content",textMax50] ] ),
async (req,res) => { //댓글 수정
    try {
        const idx = req.session.user.idx;
        const articleIdx = req.query.articleIdx;
        const commentIdx = req.params.commentIdx;
        const content = req.body.content;
        let sql;

        sql = "SELECT user_idx FROM comment WHERE idx = ?";
        const rows = await readData(sql,[commentIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "UPDATE comment SET content = ? WHERE idx = ? AND user_idx = ? AND article_idx = ?";
        await updateData(sql,[content,commentIdx,idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
router.delete("/:commentIdx",
loginCheck,
regexCheck( [ ["articleIdx",nonNegativeNumberRegex],["commentIdx",nonNegativeNumberRegex] ] ),
async (req,res) => { //댓글 삭제
    try {
        const idx = req.session.user.idx;
        const articleIdx = req.query.articleIdx;
        const commentIdx = req.params.commentIdx;
        let sql;

        sql = "SELECT user_idx FROM comment WHERE idx = ?";
        const rows = await readData(sql,[commentIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "DELETE FROM comment WHERE idx = ? AND user_idx = ? AND article_idx = ?";
        await insertData(sql,[commentIdx,idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});

router.post("/:commentIdx/like",
loginCheck,
regexCheck( [ ["commentIdx",nonNegativeNumberRegex] ] ),
async (req,res) => { //댓글 좋아요 생성
    try {
        const idx = req.session.user.idx;
        const commentIdx = req.params.commentIdx;
        let sql;

        sql = "SELECT idx FROM like_comment WHERE user_idx = ? AND comment_idx = ?";
        let rows = await readData(sql,[idx,commentIdx]);
        if(rows.length > 0) throw customError("중복된 데이터", 409);

        sql = "INSERT INTO like_comment(user_idx,comment_idx) VALUES(?,?)";
        await insertData(sql,[idx,commentIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});
router.delete("/:commentIdx/like",
loginCheck,
regexCheck( [ ["commentIdx",nonNegativeNumberRegex] ] ),
async (req,res) => { //댓글 좋아요 삭제
    try {
        const idx = req.session.user.idx;
        const commentIdx = req.params.commentIdx;
        let sql;

        sql = "SELECT idx FROM like_comment WHERE user_idx = ? AND comment_idx = ?";
        let rows = await readData(sql,[idx,commentIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "DELETE FROM like_article WHERE user_idx = ? AND comment_idx = ?";
        await deleteData(sql,[idx,commentIdx]);
        res.status(200).send({});
    } catch(e) {
        next(e);
    }
});

module.exports = router;