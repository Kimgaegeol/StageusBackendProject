const router = require("express").Router();
const session = require("express-session");

router.post("/article/:articleIdx/comment/:commentIdx",(req,res) => { //댓글 생성
    const articleIdx = req.params.articleIdx;
    const content = req.body.content
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(articleIdxRule.test(articleIdx) && commentRule.test(content)) {
        const userIdx = req.session.user.idx;
        sql = "INSERT INTO comment(article_idx,user_idx,content) VALUES(?,?,?)";
        res.send({
            "success": true,
            "message": "댓글 입력 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
router.put("/article/:articleIdx/comment/:commentIdx",(req,res) => { //댓글 수정
    const articleIdx = req.params.articleIdx;
    const commentIdx = req.params.commentIdx;
    const content = req.body.content;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(articleIdxRule.test(articleIdx) && commentIdxRule.test(commentIdx) && commentRule.test(content)) {
        const userIdx = req.session.user.idx;
        let sql = "UPDATE comment SET content = ? WHERE idx = ? AND articleIdx = ? AND user_idx = ?";
        res.send({
            "success": true,
            "message": "댓글 수정 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
router.delete("/article/:articleIdx/comment/:commentIdx",(req,res) => { //댓글 삭제
    const articleIdx = req.params.articleIdx;
    const commentIdx = req.params.commentIdx;
    const content = req.body.content;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(articleIdxRule.test(articleIdx) && commentIdxRule.test(commentIdx) && commentRule.test(content)) {
        const userIdx = req.session.user.idx;
        let sql = "DELETE FROM comment WHERE idx = ? AND articleIdx = ? AND user_idx = ?";
        res.send({
            "success": true,
            "message": "댓글 삭제 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});

router.post("/comment/:commentIdx/like",(req,res) => { //댓글 좋아요 생성
    const commentIdx = req.params.commentIdx;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(commentIdxRule.test(commentIdx)) {
        const userIdx = req.session.user.idx;
        sql = "DELETE FROM comment_recommendation(comment_idx,user_idx) VALUES(?,?)";
        res.send({
            "success": true,
            "message": "댓글 좋아요 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
router.delete("/comment/:commentIdx/like",(req,res) => { //댓글 좋아요 삭제
    const commentIdx = req.params.commentIdx;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(commentIdxRule.test(commentIdx)) {
        const userIdx = req.session.user.idx;
        sql = "INSERT INTO comment_recommendation WHERE comment_idx = ? AND user_idx = ?";
        res.send({
            "success": true,
            "message": "댓글 좋아요 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});

module.exports = router;