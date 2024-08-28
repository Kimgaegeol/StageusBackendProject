const router = require("express").Router(); // express 모듈
const regex = require("./../constant/regx"); // regex 모듈
const dbHelper = require("./../module/dbHelper"); // data 모듈
const error = require("./../module/customError"); // error 모듈

const {nonNegativeNumberRegex, textMax50} = regex;
const {insertData, readData, updateData, deleteData} = dbHelper;
const {customError, errorLogic} = error;

router.post("",async (req,res) => { //댓글 생성
    const articleIdx = req.query.articleIdx;
    const content = req.body.content
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);
        if(!textMax50.test(content)) throw customError("content", 400);

        sql = "SELECT user_idx FROM article WHERE idx = ?";
        let rows = await readData(sql,[articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "INSERT INTO comment(user_idx,article_idx,content) VALUES (?,?,?)";
        await insertData(sql,[idx,articleIdx,content]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
router.put("/:commentIdx",async (req,res) => { //댓글 수정
    const articleIdx = req.query.articleIdx;
    const commentIdx = req.params.commentIdx;
    const content = req.body.content;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);
        if(!nonNegativeNumberRegex.test(commentIdx)) throw customError("commentIdx", 400);
        if(!textMax50.test(content)) throw customError("content", 400);

        sql = "SELECT user_idx FROM comment WHERE idx = ?";
        let rows = await readData(sql,[commentIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "UPDATE comment SET content = ? WHERE idx = ? AND user_idx = ? AND article_idx = ?";
        await updateData(sql,[content,commentIdx,idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
router.delete("/:commentIdx",async (req,res) => { //댓글 삭제
    const articleIdx = req.query.articleIdx;
    const commentIdx = req.params.commentIdx;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);
        if(!nonNegativeNumberRegex.test(commentIdx)) throw customError("commentIdx", 400);

        sql = "SELECT user_idx FROM comment WHERE idx = ?";
        let rows = await readData(sql,[commentIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "DELETE FROM comment WHERE idx = ? AND user_idx = ? AND article_idx = ?";
        await insertData(sql,[commentIdx,idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});

router.post("/:commentIdx/like",async (req,res) => { //댓글 좋아요 생성
    const commentIdx = req.params.commentIdx;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;

        if(!nonNegativeNumberRegex.test(commentIdx)) throw customError("commentIdx", 400);

        sql = "SELECT idx FROM like_comment WHERE user_idx = ? AND comment_idx = ?";
        let rows = await readData(sql,[idx,commentIdx]);
        if(rows.length > 0) throw customError("중복된 데이터", 409);

        sql = "INSERT INTO like_comment(user_idx,comment_idx) VALUES(?,?)";
        await insertData(sql,[idx,commentIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
router.delete("/:commentIdx/like",async (req,res) => { //댓글 좋아요 삭제
    const commentIdx = req.params.commentIdx;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;

        if(!nonNegativeNumberRegex.test(commentIdx)) throw customError("commentIdx", 400);

        sql = "SELECT idx FROM like_comment WHERE user_idx = ? AND comment_idx = ?";
        let rows = await readData(sql,[idx,commentIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "DELETE FROM like_article WHERE user_idx = ? AND comment_idx = ?";
        await deleteData(sql,[idx,commentIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});

module.exports = router;