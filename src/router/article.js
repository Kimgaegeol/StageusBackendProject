const router = require("express").Router(); // express 모듈
const session = require("express-session"); // session 모듈
const regex = require("./../constant/regx"); // regex 모듈
const data = require("./../constant/data"); // data 모듈
const error = require("./../constant/error"); // error 모듈

const {idRegex, pwRegex, nameRegex, phoneRegex, nonNegativeNumberRegex, textMax50, textMax1000} = regex;
const {insertData, readData, updateData, deleteData} = data;
const {customError, errorLogic} = error;

//세션 설정 (저장되는 값 : idx, grade_idx)
router.use(session({
    secret: "my-secret-key", //세션 암호화를 위한 비밀키
    resave: false, // 세션이 변경되지 않아도 저장할지 여부
    saveUninitialized: false, // 초기화되지 않은 세션을 저장할지 여부
    cookie: { maxAge: 60000 } // 만료 시간 (밀리초 단위)
}));

//카테고리별 게시글읽기 -> query로 쓰는 걸로 바꾸자 (categoryIdx),
router.get("/all",async (req,res) => {
    const categoryIdx = req.query.categoryIdx;
    let sql;
    let rows;
    try {
        if(!nonNegativeNumberRegex.test(categoryIdx)) throw customError("categoryIdx", 400);

        sql = "SELECT name FROM category WHERE idx = ?";
        rows = await readData(sql,[categoryIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "SELECT account.name, article.idx, article.user_idx, article.category_idx, article.title FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.category_idx = ?";
        rows = await readData(sql,[categoryIdx]);
        res.status(200).send({
            rows
        });
    } catch(e) {
        errorLogic(res,e);
    }
});
//게시글 생성
router.post("",async (req,res) => {
    const categoryIdx = req.query.categoryIdx;
    const { title, content } = req.body;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!nonNegativeNumberRegex.test(categoryIdx)) throw customError("categoryIdx", 400);
        if(!textMax50.test(title)) throw customError("title", 400);
        if(!textMax1000.test(content)) throw customError("content", 400);

        sql = "SELECT name FROM category WHERE idx = ?";
        let rows = await readData(sql,[categoryIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "INSERT INTO article(category_idx,user_idx,title,content) VALUES (?,?,?,?)";
        await insertData(sql,[categoryIdx,idx,title,content]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
//게시글 읽기
router.get("/:articleIdx",async (req,res) => {
    const articleIdx = req.params.articleIdx;
    try {
        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);

        let sql = "SELECT account.name, article.* FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.idx = ?";
        let rows = await readData(sql,[articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        res.status(200).send({
            rows
        });
    } catch(e) {
        errorLogic(res,e);
    }
    // let articleRecommendationSql = "SELECT COUNT(*) FROM article_recommendation WHERE article_idx = ?";
    // let commentSql = "SELECT account.name, comment.* FROM comment INNER JOIN account ON comment.user_idx = account.idx WHERE comment.article_idx = ?";
});
//게시글 수정
router.put("/:articleIdx",async (req,res) => {
    const articleIdx = req.params.articleIdx;
    const { title, content } = req.body;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);
        if(!textMax50.test(title)) throw customError("title", 400);
        if(!textMax1000.test(content)) throw customError("content", 400);

        sql = "SELECT user_idx FROM article WHERE idx = ?";
        let rows = await readData(sql,[articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "UPDATE article SET title = ?, content = ? WHERE idx = ? AND user_idx = ?";
        await updateData(sql,[title,content,articleIdx,idx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
//게시글 삭제
router.delete("/:articleIdx",async (req,res) => {
    const articleIdx = req.params.articleIdx;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;
    
        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);

        sql = "SELECT user_idx FROM article WHERE idx = ?";
        let rows = await readData(sql,[articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);
        if(rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

        sql = "DELETE FROM article WHERE idx = ? AND user_idx = ?";
        await deleteData(sql,[articleIdx,idx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
//게시글 검색 (이것도 categoryIdx는 옵션느낌으로 query처리하자)
router.get("/all/search",async (req,res) => {
    console.log("실행됨");
    const categoryIdx = req.query.categoryIdx;
    const searchText = req.body.searchText;
    let sql;
    let rows;
    try {
        if(!nonNegativeNumberRegex.test(categoryIdx)) throw customError("categoryIdx", 400);
        if(!textMax50.test(searchText)) throw customError("searchText", 400);

        sql = "SELECT name FROM category WHERE idx = ?";
        rows = await readData(sql,[categoryIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "SELECT account.name, article.idx, article.user_idx, article.category_idx, article.title FROM article INNER JOIN account ON article.user_idx = account.idx WHERE article.title LIKE ? OR article.content LIKE ? AND article.category_idx = ?";
        rows = await readData(sql,[searchText,searchText,categoryIdx]);
        res.status(200).send({
            rows
        });
    } catch(e) {
        errorLogic(res,e);
    }
});
//게시글 좋아요 생성
router.post("/:articleIdx/like",async (req,res) => {
    const articleIdx = req.params.articleIdx;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;

        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);

        sql = "SELECT idx FROM like_article WHERE user_idx = ? AND article_idx = ?";
        let rows = await readData(sql,[idx,articleIdx]);
        if(rows.length > 0) throw customError("중복된 데이터", 409);

        sql = "INSERT INTO like_article(user_idx,article_idx) VALUES(?,?)";
        await insertData(sql,[idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
});
//게시글 좋아요 삭제
router.delete("/:articleIdx/like",async (req,res) => {
    const articleIdx = req.params.articleIdx;
    let sql;
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        const idx = req.session.user.idx;

        if(!nonNegativeNumberRegex.test(articleIdx)) throw customError("articleIdx", 400);

        sql = "SELECT idx FROM like_article WHERE user_idx = ? AND article_idx = ?";
        let rows = await readData(sql,[idx,articleIdx]);
        if(rows.length == 0) throw customError("존재하지 않는 데이터", 404);

        sql = "DELETE FROM like_article WHERE user_idx = ? AND article_idx = ?";
        await deleteData(sql,[idx,articleIdx]);
        res.status(200).send({});
    } catch(e) {
        errorLogic(res,e);
    }
})

module.exports = router;