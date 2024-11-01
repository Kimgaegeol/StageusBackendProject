const express = require("express");
const session = require("express-session"); // 세션 모듈 
const app = express();

//세션 설정 (저장되는 값 : idx, grade_idx)
app.use(session({
    secret: "my-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 6000000, // 만료 시간 (밀리초 단위)
        httpOnly: true // 사용자가 악의적으로 js 코드를 사용하여 (document.cookie)등을 이용해 쿠키 정보를 얻는 것을 방지
    }
}));

const cors = require('cors');

app.use(cors());

require("dotenv").config()

app.use(express.json());


// const loggingMiddleware = require('./src/middleware/logging');
// app.use(loggingMiddleware);

const managementRouter = require("./src/router/management");
app.use("/management", managementRouter);

const accountRouter = require("./src/router/account");
app.use("/account", accountRouter);

const categoryRouter = require("./src/router/category");
app.use("/category", categoryRouter);

const articleRouter = require("./src/router/article");
app.use("/article", articleRouter);

const commentRouter = require("./src/router/comment");
app.use("/comment", commentRouter);

const busLifeRouter = require("./src/router/busLife");
app.use("/busLife", busLifeRouter);

const notFoundMiddleware = require("./src/middleware/notFound");
app.use(notFoundMiddleware);

const errorHandlerMiddleware = require("./src/middleware/errorHandler");
app.use(errorHandlerMiddleware);

server.listen(8500, () => {
    console.log("8500번 포트에서 웹 서버 실행됨");
});