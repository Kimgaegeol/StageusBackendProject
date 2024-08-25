const regex = require("./../constant/regx"); // regex 모듈
const router = require("express").Router(); // express 모듈
const session = require("express-session"); // session 모듈

const {idRegex, pwRegex, nameRegex, phoneRegex, nonNegativeNumberRegex, textMax50, textMax1000} = regex;

const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: "localhost",
    user: "stageus",
    password: "1234",
    database: "article",
    connectionLimit: 10
});

async function insertData(sql,list) {
    try {
        const connection = await pool.getConnection();
        const result =  await connection.query(sql, list);
        console.log(result.insertId);
        return true;
    } catch(err) {
        console.log(err);
        return err;
    }
}

async function readData(sql,list) {
    try{
        const connection = await pool.getConnection();
        const rows = await connection.query(sql,list);
        console.log(rows);
        return rows;
    } catch(err) {
        console.log(err);
        return err.message;
    }
}

const updateData = (sql,list) => {
    try {
        const result = connection.query(sql, list);
        console.log(result.affectedRows);
        return true;
    } catch(err) {
        console.log(err);
        return err.message;
    }
}

const deleteData = (sql,list) => {
    try {
        const result = connection.query(sql, list);
        console.log(result.affectedRows);
        return true;
    } catch(err) {
        console.log(err);
        return err.message;
    }
}

const customError = (message,status) => {
    const err = new Error(message);
    err.status = status;
    return err
}

//세션 설정 (저장되는 값 : idx, grade_idx)
router.use(session({
    secret: "my-secret-key", //세션 암호화를 위한 비밀키
    resave: false, // 세션이 변경되지 않아도 저장할지 여부
    saveUninitialized: false, // 초기화되지 않은 세션을 저장할지 여부
    cookie: { maxAge: 60000 } // 만료 시간 (밀리초 단위)
}));

router.post("/login",(req,res) => { //로그인
    const { id, pw } = req.body;
    try {
        if(!idRegex.test(id)) throw customError({ key : "id"}, 400);
        if(!pwRegex.test(pw)) throw customError({ key : "pw"}, 400);
        const idx = 19;
        const gradeIdx = 0;
        req.session.user = { //세션에 idx저장
            idx: idx,
            gradeIdx: gradeIdx
        };
        res.status(200).send({});
    } catch (e) {
        res.status(e.status || 500).send({
            "success": false,
            "message": e.message
        });
    }
});

router.delete("/logout",(req,res) => { //로그아웃
    try {
        if(!req.session.user) throw customError({ message : "세션 만료" }, 401);
        req.session.destroy();
        res.status(200).send({});
    } catch (e) {
        res.status(e.status || 500).send({
            "success": false,
            "message": e.message
        });
    }
});

router.post("/user", async (req,res) => { //계정생성
    const id = req.body.id;
    const pw = req.body.pw;
    const name = req.body.name;
    const phone = req.body.phone;
    let sql;
    let rows;
    try {
        if(!idRegex.test(id)) throw customError("id", 400);
        if(!pwRegex.test(pw)) throw customError("pw", 400);
        if(!nameRegex.test(name)) throw customError("name", 400);
        if(!phoneRegex.test(phone)) throw customError("phone", 400);

        sql = "SELECT idx FROM account WHERE id = ?"; // (아이디 중복체크) (성공시, 전화번호 중복체크로 이동)
        rows = await readData(sql,[id]);
        if(rows.length > 0) throw customError("id", 409)

        sql = "SELECT idx FROM account WHERE phone = ?"; // (전화번호 중복체크) (성공시, 회원가입 과정으로 이동)
        rows = await readData(sql,[phone]);
        if(rows.length > 0) throw customError("phone", 409);

        sql = "INSERT INTO account(grade_idx,id,pw,name,phone) VALUES (?,?,?,?,?)"; //grade_idx는 일단 2로 넣을 것 (0:관리자, 1:중간 관리자, 2:일반 사용자)
        await insertData(sql,[2,id,pw,name,phone]);
        res.status(200).send({});
    } catch (e) {
        res.status(e.status || 500).send({
            "status": e.status,
            "message": e.message
        });
    }
});

router.get("/user",(req,res) => { //계정읽기 ( 입력한 비밀번호가 맞을 시, 계정정보 가져옴 )
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
router.put("/user/id",(req,res) => { //id
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
router.put("/user/pw",(req,res) => { //pw
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
router.put("/user/name",(req,res) => { //name
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
router.put("/user/phone",(req,res) => { //phone
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
router.put("/user/grade",(req,res)=> { //grade_idx (관리자)
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
router.delete("/user",(req,res) => { //계정삭제
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


router.get("/user/id",(req,res) => { //아이디 찾기
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
router.get("/user/pw",(req,res) => { //비밀번호 찾기
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

module.exports = router;
