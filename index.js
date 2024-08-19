const express = require("express");
const session = require("express-session"); // 세션 모듈 
const app = express();

//세션 설정 (저장되는 값 : idx, grade_idx)
app.use(session({
    secret: "my-secret-key", //세션 암호화를 위한 비밀키
    resave: false, // 세션이 변경되지 않아도 저장할지 여부
    saveUninitialized: false, // 초기화되지 않은 세션을 저장할지 여부
    cookie: { maxAge: 60000 } // 만료 시간 (밀리초 단위)
}));

app.use(express.json());

//정규표현식 모음 (idxRule로 합치자) + textrule의 제약조건에는 max값 등으로 넣자.
const userIdxRule = /^\d+$/;
const idRule = /^(?=.*[a-zA-Z])(?=.*[0-9]).{4,20}$/;
const pwRule = /^(?=.*[a-zA-Z])(?=.*[0-9]).{4,20}$/;
const nameRule = /^[가-힣a-zA-Z].{1,20}$/;
const phoneRule = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
const gradeIdxRule = /^\d+$/;
const categoryIdxRule = /^\d+$/;
const categoryNameRule = /^[가-힣a-zA-Z].{1,40}$/;
const searchTextRule = /^.{1,100}$/;
const articleIdxRule = /^\d+$/;
const articleTitleRule = /^.{1,50}$/;
const articleContentRule = /^.{0,1000}$/;
const commentIdxRule = /^\d+$/;
const commentRule = /^.{1,100}$/;

const textMax100 = /^.{1,100}$/;

app.post("/login",(req,res) => { //로그인
    //body사용 이유 : url에 민감한 id와 pw정보를 보여주지 않을 수 있음
    // const id = req.body.id;
    // const pw = req.body.pw;
    const { id, pw } = req.body;

    if(idRule.test(id) && pwRule.test(pw)) { //프론트엔드는 다 뚫릴 수 있기 때문에 예외처리 해줌
        let sql = "SELECT idx, grade_idx FROM account WHERE id = ? AND pw = ?";
        //존재하는 계정일시
        const idx = 19;
        const gradeIdx = 0;
        req.session.user = { //세션에 idx저장
            idx: idx,
            gradeIdx: gradeIdx
        };
        res.send({
            "success": true,
            "message": "로그인 성공",
            "idx": req.session.user.idx,
            "grade_idx": req.session.user.gradeIdx
        });
        // //존재하지 않는 계정일 시,
        // res.send({
        //     "success": false,
        //     "message": "존재하지 않는 계정"
        // });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
    // ++네트워크 오류 같은 것들도 시간나면 찾아보자
});
app.post("/user",(req,res) => { //계정생성
    //body사용 이유 : url에 민감한 사용자 정보를 안 보여줄 수 있음
    const id = req.body.id;
    const pw = req.body.pw;
    const name = req.body.name;
    const phone = req.body.phone;
    if(idRule.test(id) && pwRule.test(pw) && nameRule.test(name) && phoneRule.test(phone)) {
        let idOverLapSql = "SELECT idx FROM account WHERE id = ?"; // (아이디 중복체크) (성공시, 전화번호 중복체크로 이동)
        let phoneOverLapSql = "SELECT idx FROM account WHERE phone = ?"; // (전화번호 중복체크) (성공시, 회원가입 과정으로 이동)

        let insertUserSql = "INSERT INTO account(grade_idx,id,pw,name,phone) VALUES (?,?,?,?,?)"; //grade_idx는 일단 2로 넣을 것 (0:관리자, 1:중간 관리자, 2:일반 사용자)
        res.send({
            "success": true,
            "message": "회원가입 성공"
        });
        // //아이디 중복체크 실패
        // res.send({
        //     "success": false,
        //     "message": "중복된 아이디"
        // });
        // //전화번호 중복체크 실패
        // res.send({
        //     "success": false,
        //     "message": "중복된 전화번호"
        // });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }

});
app.get("/user",(req,res) => { //계정읽기 ( 입력한 비밀번호가 맞을 시, 계정정보 가져옴 )
    //OBJ은 무조건 변수로 할당해서 쓰자
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료" //세션만료된 건 우짬?
        });
    }
    else if(pwRule.test(req.body.pw)) {
        const idx = req.session.user.idx;
        const pw = req.body.pw;
        let sql = "SELECT id,pw,name,phone FROM account WHERE pw =? AND idx = ?";
        //한개라도 있다면 
        res.send({
            "success": true,
            "message": "계정읽기 성공",
            "id": "stageus2",
            "pw": pw,
            "name": "김재걸",
            "phone": "010-5592-1087"
        });
        //없다면
        res.send({
            "success": false,
            "message": "비밀번호가 틀림"
        }); 
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        }); 
    }
});
//계정수정 (회원 정보는 세션에 있음)
app.put("/user/id",(req,res) => { //id
    const id = req.body.id; //id가 아에 안왔을 경우도 적어주자 ㄱㄷㄱㄷ
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(idRule.test(id)) {
        const idx = req.session.user.idx;
        let sql = "UPDATE account SET id = ?"; //이것도 업데이트가 됐는 지. 안 됐는 지 확인 해야 하나?
        res.send({
            "success": true,
            "message": "아이디 변경 성공"
        });     
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });  
    }
});
app.put("/user/pw",(req,res) => { //pw
    const pw = req.body.pw;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(pwRule.test(pw)) {
        const idx = req.session.user.idx;
        let sql = "UPDATE account SET pw = ? WHERE idx = ?"; //이것도 업데이트가 됐는 지. 안 됐는 지 확인 해야 하나?
        res.send({
            "success": true,
            "message": "비밀번호 변경 성공",
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족",
        }); 
    }
});
app.put("/user/name",(req,res) => { //name
    const name = req.body.name; //이름이 안왔을 경우도 적어줘야 함 하;;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(nameRule.test(name)) {
        const idx = req.session.user.idx;
        let sql = "UPDATE account SET name = ? WHERE idx = ?";
        res.send({
            "success": true,
            "message": "이름 변경 성공",
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족",
        }); 
    }
});
app.put("/user/phone",(req,res) => { //phone
    const phone = req.body.phone;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(phoneRule.test(phone)) {
        const idx = req.session.user.idx;
        let sql = "UPDATE account SET phone = ? WHERE idx = ?";
        res.send({
            "success": true,
            "message": "전화번호 변경 성공"
        });     
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
app.put("/user/grade",(req,res)=> { //grade_idx (관리자)
    const userIdx = req.body.userIdx;
    const userGradeIdx = req.body.gradeIdx;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(req.session.user.gradeIdx != 0) {
        res.send({
            "success": false,
            "message": "관리자계정 인증 오류"
        });     
    }
    else if(userIdxRule.test(userIdx) && gradeIdxRule.test(userGradeIdx)){
        const myIdx = req.session.user.idx;
        const mygradeIdx = req.session.user.gradeIdx;
        let sql = "UPDATE account SET grade_idx = ? WHERE idx = ?";
        res.send({
            "success": true,
            "message": "권한 변경 성공"
        });  
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
})
app.delete("/user",(req,res) => { //계정삭제
    const pw = req.body.pw;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(pwRule.test(pw)) {
        const idx = req.session.user.idx;
        let sql = "DELETE FROM account WHERE idx = ? AND pw = ?" // 이것도 삭제 됐는 지 안 됐는 지 확인해야하나?? + 삭제됐는지 안됐는지 나중에 확인
        res.send({
            "success": true,
            "message": "계정삭제 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "비밀번호 제약 조건 불만족"
        });
    }
});


app.get("/user/id",(req,res) => { //아이디 찾기
    const phone = req.body.phone;
    if(phoneRule.test(phone)) {
        let sql = "SELECT id FROM account WHERE phone = ?";
        res.send({
            "success": true,
            "message": "아이디찾기 성공",
            "id": "stageus1"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
app.get("/user/pw",(req,res) => { //비밀번호 찾기
    const id = req.body.id;
    const phone = req.body.phone;
    if(idRule.test(id) && phoneRule.test(phone)) {
        let sql = "SELECT pw FROM account WHERE id = ? AND phone = ?";
        res.send({
            "success": true,
            "message": "비밀번호찾기 성공",
            "pw": "stageus1"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});


app.get("/category/all",(req,res) => { //카테고리 목록 가져오기
    let sql = "SELECT * FROM category";
    const categoryList = [[0,"롤"],[1,"피파"],[2,"배그"]];
    res.send({
        "success": true,
        "message": "카테고리 가져오기 성공",
        "category_list": categoryList
    });
});
app.post("/category",(req,res) => { //카테고리 생성 (관리자)
    const categoryName = req.body.categoryName;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(!categoryNameRule.test(categoryName)) {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
    else if(req.session.user.gradeIdx == 0) {
        const idx = req.session.user.idx;
        const gradeIdx = req.session.user.gradeIdx;
        let sql = "INSERT INTO category(name) VALUES (?)";
        res.send({
            "success": true,
            "message": "카테고리 추가 성공"
        });
    }
    else {
        res.send({
            "success": true,
            "message": "관리자계정 인증 오류"
        }); 
    }
});
app.put("/category",(req,res) => { //카테고리 수정 (관리자)
    const categoryName = req.body.categoryName;
    const categoryIdx = req.body.categoryIdx;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(req.session.user.gradeIdx != 0) {
                res.send({
            "success": false,
            "message": "관리자계정 인증 오류"
        }); 

    }
    else if(categoryNameRule.test(categoryName) && categoryIdxRule.test(categoryIdx)) {
        const idx = req.session.user.idx;
        const gradeIdx = req.session.user.gradeIdx;
        let sql = "UPDATE category SET name = ? WHERE idx = ?"
        res.send({
            "success": true,
            "message": "카테고리 변경 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        });
    }
});
app.delete("/category",(req,res) => { //카테고리 삭제 (관리자)
    const categoryIdx = req.body.categoryIdx;
    if(!req.session.user) {
        res.send({
            "success": false,
            "message": "세션 만료"
        });
    }
    else if(req.session.user.gradeIdx != 0) {
        res.send({
            "success": true,
            "message": "관리자계정 인증 오류"
        }); 

    }
    else if(categoryIdxRule.test(categoryIdx)) {
        const idx = req.session.user.idx;
        const gradeIdx = req.session.user.gradeIdx;
        let sql = "DELETE FROM category WHERE idx = ?";
        res.send({
            "success": true,
            "message": "카테고리 삭제 성공"
        });
    }
    else {
        res.send({
            "success": false,
            "message": "제약조건 불만족"
        }); 
    }
});


app.get("/article/all/:categoryIdx",(req,res) => { //카테고리별 게시글읽기 -> query로 쓰는 걸로 바꾸자 (categoryIdx), 
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
app.post("/article/:categoryidx",(req,res) => { //게시글 생성
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
app.get("/article/:articleIdx",(req,res) => { //게시글 읽기
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
app.put("/article/:articleIdx",(req,res) => { //게시글 수정
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
app.put("/article/:articleIdx",(req,res) => { //게시글 삭제
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
app.get("/article/:categoryIdx/search",(req,res) => { //게시글 검색 (이것도 categoryIdx는 옵션느낌으로 query처리하자)
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

app.post("/article/:articleIdx/like",(req,res) => { //게시글 좋아요 생성
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
app.delete("/article/:articleIdx/like",(req,res) => { //게시글 좋아요 삭제
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


app.post("/article/:articleIdx/comment/:commentIdx",(req,res) => { //댓글 생성
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
app.put("/article/:articleIdx/comment/:commentIdx",(req,res) => { //댓글 수정
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
app.delete("/article/:articleIdx/comment/:commentIdx",(req,res) => { //댓글 삭제
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

app.post("/comment/:commentIdx/like",(req,res) => { //댓글 좋아요 생성
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
app.delete("/comment/:commentIdx/like",(req,res) => { //댓글 좋아요 삭제
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


app.listen(8500, () => {
    console.log("8500번 포트에서 웹 서버 실행됨");
})