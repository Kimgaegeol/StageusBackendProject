const router = require("express").Router();
const path = require("path");

router.get("/home", (req, res) => { //req는 요청, res는 응답
    //res.sendFile(`${__dirname}../page/home.html`);//__dirname은 절대경로
    res.sendFile(path.join(__dirname, "../busLive/index.html")); // join은 매개변수를 조합해줌 -> 
    // 위에는 string이라 계산이안됨(..을 안먹음) -> path 사용의 이유
})

module.exports = router;