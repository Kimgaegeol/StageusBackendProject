const router = require("express").Router();
const session = require("express-session");

router.get("/article/all/:categoryIdx",(req,res) => { //카테고리별 게시글읽기 -> query로 쓰는 걸로 바꾸자 (categoryIdx), 
    const categoryIdx = req.params.categoryIdx;
    if(categoryIdxRule.test(categoryIdx)) {
        let sql = "SELECT account.name, article.* FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.category_idx = ?";
        let recommendationSql = "" //나중에 각게시글마다 좋아요도 보일 수 있도록 하기
        const articleList = [[0,"김재걸","제목","내용"][1,"김재걸","제에목","내애용"]];
        res.send({
            "success": true,
            "message": "게시글 가져오기 성공",
            "articleList": articleList
        })
    }
    else {
        res.send({
            "success": false,
            "message": "올바르지 않은 idx"
        })
    }

});
router.post("/article/:categoryidx",(req,res) => { //게시글 생성
    const categoryIdx = req.params.categoryIdx;
    const articleTitle = req.body.title;
    const articleContent = req.body.content;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(categoryIdxRule.test(categoryIdx) && articleTitleRule.test(articleTitle) && articleContentRule.test(articleContent)) {
        const userIdx = req.session.user.idx;
        let sql = "INSERT INTO article(category_idx,user_idx,title,content) VALUES (?,?,?,?)";
        res.send({
            "success": true,
            "message": "게시글 등록 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        })
    }
});
router.get("/article/:articleIdx",(req,res) => { //게시글 읽기
    const articleIdx = req.params.articleIdx;
    if(articleIdx.test(articleIdx)) {
        let articleSql = "SELECT account.name, article.* FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.idx = ?";
        let articleRecommendationSql = "SELECT COUNT(*) FROM article_recommendation WHERE article_idx = ?";
        const name = "김재걸";
        const title = "제목입니다.";
        const content = "내용입니다.";
        const recommendation = 1;
        //댓글 읽기 + 댓글마다 좋아요도 보일 수 있도록 query짜기
        let commentSql = "SELECT account.name, comment.* FROM comment INNER JOIN account ON comment.user_idx = account.idx WHERE comment.article_idx = ?";
        const commentList = [[0,"김재걸","내용","2024.08.17"]]; 
        res.send({
            "success": true,
            "message": "게시글 읽기 성공",
             "name": name,
            "title": title,
            "content": content,
            "recommendation": recommendation,
            "commentList": commentList
        });
    }
});
router.put("/article/:articleIdx",(req,res) => { //게시글 수정
    const articleIdx = req.params.articleIdx;
    const articleTitle = req.body.title;
    const articleContent = req.body.Content;

    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(articleTitleRule.test(articleTitle) && articleContentRule.test(articleContent)) {
        const userIdx = req.session.user.idx;
        let sql = "UPDATE article SET title = ? AND content = ? WHERE idx = ? AND user_idx = ?";
        res.send({
            "success": true,
            "message": "게시글 수정 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
router.put("/article/:articleIdx",(req,res) => { //게시글 삭제
    const articleIdx = req.params.articleIdx;
    if(req.session.user) {
        const userIdx = req.session.user.idx;
        let sql = "DELETE FROM account WHERE idx = ? AND user_idx = ?";
        res.send({
            "success": true,
            "message": "게시글 삭제 성공 완료"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
});
router.get("/article/:categoryIdx/search",(req,res) => { //게시글 검색 (이것도 categoryIdx는 옵션느낌으로 query처리하자)
    const categoryIdx = req.params.categoryIdx;
    const serachText = req.body.searchText;
    if(searchTextRule.test(searchText)) {
        let sql = "SELECT account.name, article.* FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.title LIKE ? OR article.content LIKE ? AND article.category_idx = ?";
        const inputText = "%" + searchText + "%";
        const articleList = [["김재걸","제목","내용"]["김재걸","제에목","내애용"]]; // 추천도 나중에 고려하자
        res.send({
            "success": true,
            "message": "게시글 가져오기 성공",
            "articleList": articleList
        })
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        })
        
    }
})

router.post("/article/:articleIdx/like",(req,res) => { //게시글 좋아요 생성
    const articleIdx = req.params.articleIdx;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(articleIdxRule.test(articleIdx)) {
        const userIdx = req.session.user.idx;
        sql = "INSERT INTO article_recommendation(article_idx,user_idx) VALUES(?,?)";
        res.send({
            "success": true,
            "message": "게시글 좋아요 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
router.delete("/article/:articleIdx/like",(req,res) => { //게시글 좋아요 삭제
    const articleIdx = req.params.articleIdx;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(articleIdxRule.test(articleIdx)) {
        const userIdx = req.session.user.idx;
        sql = "DELETE FROM article_recommendation WHERE article_idx = ? AND userIdx = ?";
        res.send({
            "success": true,
            "message": "게시글 지우기 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
})

module.exports = router;