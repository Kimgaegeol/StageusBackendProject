const router = require("express").Router();
const session = require("express-session");

router.get("/category/all",(req,res) => { //카테고리 목록 가져오기
    let sql = "SELECT * FROM category";
    const categoryList = [[0,"롤"],[1,"피파"],[2,"배그"]];
    res.send({
        "success": true,
        "message": "카테고리 가져오기 성공",
        "category_list": categoryList
    });
});
router.post("/category",(req,res) => { //카테고리 생성 (관리자)
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
router.put("/category",(req,res) => { //카테고리 수정 (관리자)
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
router.delete("/category",(req,res) => { //카테고리 삭제 (관리자)
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

module.exports = router;