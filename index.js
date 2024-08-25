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

const accountRouter = require("./src/router/account");
app.use("/account", accountRouter);

const categoryRouter = require("./src/router/category");
app.use("/category", categoryRouter);

const articleRouter = require("./src/router/article");
app.use("/article", articleRouter);

const commentRouter = require("./src/router/comment");
app.use("/comment", commentRouter);


app.listen(8500, () => {
    console.log("8500번 포트에서 웹 서버 실행됨");
});