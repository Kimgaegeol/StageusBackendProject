const router = require("express").Router(); // express 모듈
const jwt = require("jsonwebtoken");

const client = require("./../config/postgresql"); // psql

const customError = require("./../module/customError"); // error 모듈
const tcWrapper = require("../module/tcWrapper"); // trycatch wrapper

const regexCheck = require("./../middleware/regexCheck"); // 정규포현식체크 미들웨어
const loginCheck = require("./../middleware/loginCheck");// 로그인체크 미들웨어
const duplicateCheck = require("./../middleware/duplicateCheck");// 중복체크 미들웨어
const roleCheck = require("./../middleware/roleCheck"); // 관리자 권한체크 미들웨어
const dataCheck = require("../middleware/dataCheck"); // 데이터 체크 미들웨어

const regex = require("./../constant/regx");
const role = require("./../constant/role");

const { idRegex, pwRegex, nameRegex, phoneRegex, nonNegativeNumberRegex } = regex;
const { manager, staff, user } = role; // manager : 1, staff : 2, user : 3


//로그인 (dataCheckMiddleware를 쓰지 않는 이유 : 굳이 2번 db통신을 할 필요는 없다.)
router.post("/login",
    regexCheck([["id", idRegex], ["pw", pwRegex]]),
    tcWrapper(
        async (req, res, next) => {
            const { id, pw } = req.body;

            const sql = "SELECT idx,grade_idx,name From account.list WHERE id=$1 AND pw=$2";
            const result = await client.query(sql, [id, pw]);

            if (result.rows.length == 0) throw customError("존재하지 않는 계정입니다.", 404);

            const idx = result.rows[0].idx;
            const gradeIdx = result.rows[0].grade_idx;
            const name = result.rows[0].name;

            const token = jwt.sign({
                "idx": idx,
                "role": gradeIdx,
                "name": name
            }, process.env.JWT_SIGNATURE_KEY, {
                "issuer": "kimgaegeol",
                "expiresIn": "2h"
            });

            res.locals.data = token;

            res.status(200).send({
                "token": token
            });
        }));

//로그아웃
router.delete("/logout",
    loginCheck,
    tcWrapper(
        (req, res, next) => {
            //발급된 토큰 삭제해야함
            res.status(200).send({});
        }));

//계정생성
router.post("/user",
    regexCheck([["id", idRegex], ["pw", pwRegex], ["name", nameRegex], ["phone", phoneRegex]]),
    duplicateCheck("SELECT idx FROM account.list WHERE id=$1", "id", ["id"]),
    duplicateCheck("SELECT idx FROM account.list WHERE phone=$1", "phone", ["phone"]),
    tcWrapper(
        async (req, res, next) => {
            const { id, pw, name, phone } = req.body;

            const sql = "INSERT INTO account.list(grade_idx,id,pw,name,phone) VALUES ($1,$2,$3,$4,$5)"; //grade_idx는 일단 3
            await client.query(sql, [3, id, pw, name, phone]);

            res.status(200).send({});
        }));

//계정읽기
router.get("/user",
    loginCheck,
    regexCheck([["pw", pwRegex]]),
    tcWrapper(
        async (req, res, next) => {
            const { pw } = req.body;
            const { idx } = req.decoded;

            const sql = "SELECT id,pw,name,phone FROM account.list WHERE idx=$1 AND pw=$2";
            const result = await client.query(sql, [idx, pw]);

            if (result.rows.length == 0) throw customError("존재하지 않는 계정입니다.", 404);

            res.locals.data = {
                "id": result.rows[0].id,
                "pw": result.rows[0].pw,
                "name": result.rows[0].name,
                "phone": result.rows[0].phone
            };

            res.status(200).send({
                "id": result.rows[0].id,
                "pw": result.rows[0].pw,
                "name": result.rows[0].name,
                "phone": result.rows[0].phone
            });
        }));

//계정수정
router.put("/user",
    loginCheck,
    regexCheck([["id", idRegex], ["pw", pwRegex], ["changePw", pwRegex], ["name", nameRegex], ["phone", phoneRegex]]),
    duplicateCheck("SELECT idx FROM account.list WHERE id=$1", "id", ["id"]),
    duplicateCheck("SELECT idx FROM account.list WHERE phone=$1", "phone", ["phone"]),
    dataCheck("SELECT * FROM account.list WHERE idx=$1 AND pw=$2", ["idx", "pw"], "존재하지 않는 계정입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { id, changePw, name, phone } = req.body;
            const { idx } = req.decoded;

            sql = "UPDATE account.list SET id=$1, pw=$2, name=$3, phone=$4 WHERE idx=$5";
            await client.query(sql, [id, changePw, name, phone, idx]);

            res.status(200).send({});
        }));

//grade_idx 수정 (관리자)
router.put("/user/grade",
    loginCheck,
    roleCheck(manager),
    regexCheck([["userIdx", nonNegativeNumberRegex], ["userGradeIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT * FROM account.list WHERE idx=$1", ["userIdx"], "존재하지 않는 계정입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { userIdx, userGradeIdx } = req.body;

            const sql = "UPDATE account.list SET grade_idx=$1 WHERE idx=$2";
            await client.query(sql, [userGradeIdx, userIdx]);

            res.status(200).send({});
        }));

//계정삭제
router.delete("/user",
    loginCheck,
    regexCheck([["pw", pwRegex]]),
    dataCheck("SELECT * FROM account.list WHERE idx=$1 AND pw=$2", ["idx", "pw"], "존재하지 않는 계정입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;

            const sql = "DELETE FROM account.list WHERE idx=$1";
            await client.query(sql, [idx]);

            res.status(200).send({});
        }));

//아이디 찾기
router.get("/user/id",
    regexCheck([["phone", phoneRegex]]),
    tcWrapper(
        async (req, res, next) => {
            const { phone } = req.body;

            const sql = "SELECT id FROM account.list WHERE phone=$1";
            const result = await client.query(sql, [phone]);

            if (result.rows.length == 0) throw customError("알맞은 id가 존재하지 않습니다.", 404);

            res.locals.data = result.rows[0].id;

            res.status(200).send({
                "id": result.rows[0].id
            });
        }));

//비밀번호 찾기
router.get("/user/pw",
    regexCheck([["id", idRegex], ["phone", phoneRegex]]),
    tcWrapper(
        async (req, res, next) => {
            const { id, phone } = req.body;

            const sql = "SELECT pw FROM account.list WHERE id=$1 AND phone=$2";
            const result = await client.query(sql, [id, phone]);

            if (result.rows.length == 0) throw customError("알맞은 pw가 존재하지 않습니다.", 404);

            res.locals.data = result.rows[0].pw;

            res.status(200).send({
                "pw": result.rows[0].pw
            });
        }));

module.exports = router;