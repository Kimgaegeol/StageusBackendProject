const router = require("express").Router(); // express
const client = require("../config/postgresql");

const regex = require("./../constant/regx");
const role = require("./../constant/role"); // 나중에 관리자 권한으로 게시글 락거는 기능도 만들자

const dbHelper = require("./../module/dbHelper");
const customError = require("./../module/customError");
const tcWrapper = require("../module/tcWrapper");

const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const dataCheck = require("./../middleware/dataCheck");
const duplicateCheck = require("../middleware/duplicateCheck");

const { nonNegativeNumberRegex, textMax50, textMax1000 } = regex;
const { manager, staff, user } = role; // manager : 1, staff : 2, user : 3

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");

// AWS S3 설정  (다른 폴더에 들어가는 게 좋음 config 에 빼자)
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer S3 설정
const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        acl: "public-read",
        key: function (req, file, cb) {
            const fileName = Date.now().toString() + "-" + file.originalname;
            cb(null, fileName);
        }
    })
})

const path = require('path');
const fs = require("fs");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "/mnt/data/uploads";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadEBS = multer({ storage: storage });

//카테고리별 게시글읽기
router.get(
    "/all",
    regexCheck([["categoryIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT name FROM article.category WHERE idx=$1", ["categoryIdx"], "존재하지 않는 카테고리입니다."),
    tcWrapper(async (req, res, next) => {
        const { categoryIdx } = req.query; // order by idx desc 붙히기, sql문 여러줄로 쓰기 (보기 편하게) + 페이지네이션은 새로운 sql문 써야되니까 검색하자

        const sql = "SELECT account.list.name, article.list.idx, article.list.user_idx, article.list.category_idx, article.list.title FROM article.list INNER JOIN account.list ON article.list.user_idx = account.list.idx WHERE article.list.category_idx=$1";
        const { result, error } = await dbHelper(sql, [categoryIdx]);

        if (error) throw error;

        res.status(200).send({
            "data": result.rows
        });
    })
);

// 게시글 생성 (이미지 없음)
router.post("",
    loginCheck,
    regexCheck([["categoryIdx", nonNegativeNumberRegex], ["title", textMax50], ["content", textMax1000]]),
    dataCheck("SELECT name FROM article.category WHERE idx=$1", ["categoryIdx"], "존재하지 않는 카테고리입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { categoryIdx } = req.query;
            const { title, content } = req.body;
            const { idx } = req.decoded;

            const sql = "INSERT INTO article.list(user_idx,category_idx,title,content) VALUES ($1,$2,$3,$4)";
            await client.query(sql, [idx, categoryIdx, title, content]);

            res.status(200).send({});
        }));

// 게시글 생성 (s3)
router.post("/s3",
    loginCheck,
    uploadS3.single('image'),
    regexCheck([["categoryIdx", nonNegativeNumberRegex], ["title", textMax50], ["content", textMax1000]]),
    dataCheck("SELECT name FROM article.category WHERE idx=$1", ["categoryIdx"], "존재하지 않는 카테고리입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { categoryIdx } = req.query;
            const { title, content } = req.body;
            const { idx } = req.decoded;

            // 파일이 없으면 오류 발생
            if (!req.file) throw customError("이미지 파일이 존재하지 않습니다.", 404);

            // 파일 업로드 후 S3에 저장된 URL 반환
            const fileUrl = req.file.location;

            const sql = "INSERT INTO article.list(user_idx,category_idx,title,content,image_s3) VALUES ($1,$2,$3,$4,$5)";
            await client.query(sql, [idx, categoryIdx, title, content, fileUrl]);

            res.status(200).send({});
        }
    )
);

// 게시글 생성 (ebs)
router.post("/ebs",
    loginCheck,
    regexCheck([["categoryIdx", nonNegativeNumberRegex], ["title", textMax50], ["content", textMax1000]]),
    dataCheck("SELECT name FROM article.category WHERE idx=$1", ["categoryIdx"], "존재하지 않는 카테고리입니다."),
    uploadEBS.single('image'),
    tcWrapper(
        async (req, res, next) => {
            const { categoryIdx } = req.query;
            const { title, content } = req.body;
            const { idx } = req.decoded;

            if (!req.file) throw customError("이미지 파일이 존재하지 않습니다.", 404);

            const filePath = req.file.path;

            const sql = "INSERT INTO article.list(user_idx,category_idx,title,content,image_ebs) VALUES ($1,$2,$3,$4,$5)";
            await client.query(sql, [idx, categoryIdx, title, content, filePath]);

            res.status(200).send({});
        }
    )
);

//게시글 읽기
router.get("/:articleIdx",
    regexCheck([["articleIdx", nonNegativeNumberRegex]]),
    tcWrapper(
        async (req, res, next) => {
            const { articleIdx } = req.params;

            const sql = "SELECT account.list.name, article.list.*, COUNT(article.like.idx) FROM article.list INNER JOIN account.list ON article.list.user_idx = account.list.idx LEFT JOIN article.like ON article.list.idx = article.like.article_idx WHERE article.list.idx=$1 GROUP BY account.list.name, article.list.idx";
            const result = await client.query(sql, [articleIdx]);

            if (result.rows.length == 0) throw customError("게시물이 존재하지 않습니다.", 404);

            res.locals.data = result.rows;

            res.status(200).send({
                "data": result.rows
            });
        }));

//게시글 수정(이미지 없음)
router.put("/:articleIdx",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex], ["title", textMax50], ["content", textMax1000]]),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.params;
            const { title, content } = req.body;
            let sql;

            sql = "SELECT user_idx FROM article.list WHERE idx=$1"; // "잘못된 접근도 체크해야 하기 떄문에 여기서 함"
            const result = await client.query(sql, [articleIdx]);

            if (result.rows.length == 0) throw customError("존재하지 않는 게시물입니다.", 404);
            if (result.rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

            sql = "UPDATE article.list SET title=$1, content=$2 WHERE idx=$3";
            await client.query(sql, [title, content, articleIdx]);

            res.status(200).send({});
        }));

// 게시글 수정(s3)
router.put("/s3/:articleIdx",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex], ["title", textMax50], ["content", textMax1000]]),
    uploadS3.single('image'),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.params;
            const { title, content, fileUrl } = req.body;

            const newFileUrl = req.file.location;

            let sql;

            if (!req.file) throw customError("이미지 파일이 존재하지 않습니다.", 404);

            sql = "SELECT user_idx FROM article.list WHERE idx=$1"; // "잘못된 접근도 체크해야 하기 떄문에 여기서 함"
            const result = await client.query(sql, [articleIdx]);


            if (result.rows.length == 0) throw customError("존재하지 않는 게시물입니다.", 404);
            if (result.rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

            // s3에서 파일 삭제
            const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: fileUrl
            }

            await s3.send(new DeleteObjectCommand(deleteParams));

            sql = "UPDATE article.list SET title=$1, content=$2, image_s3=$3 WHERE idx=$4";
            await client.query(sql, [title, content, newFileUrl, articleIdx]);

            res.status(200).send({});
        }
    )
)

// 게시글 수정(ebs)
router.put("/ebs/:articleIdx",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex], ["title", textMax50], ["content", textMax1000]]),
    uploadEBS.single('image'),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.params;
            const { title, content, filePath } = req.body;

            const newFilePath = req.file.path;

            let sql;

            if (!req.file) throw customError("이미지 파일이 존재하지 않습니다.", 404);

            sql = "SELECT user_idx FROM article.list WHERE idx=$1"; // "잘못된 접근도 체크해야 하기 떄문에 여기서 함"
            const result = await client.query(sql, [articleIdx]);


            if (result.rows.length == 0) throw customError("존재하지 않는 게시물입니다.", 404);
            if (result.rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

            // ebs에서 파일 삭제
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // 파일 삭제

            sql = "UPDATE article.list SET title=$1, content=$2, image_ebs=$3 WHERE idx=$4";
            await client.query(sql, [title, content, newFilePath, articleIdx]);

            res.status(200).send({});
        }
    )
)

// 게시글 삭제
router.delete("/:articleIdx",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex]]),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.params;
            let sql;

            sql = "SELECT user_idx FROM article.list WHERE idx=$1";
            const result = await client.query(sql, [articleIdx]);

            if (result.rows.length == 0) throw customError("존재하지 않는 데이터", 404);
            if (result.rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

            sql = "DELETE FROM article.list WHERE idx=$1";
            await client.query(sql, [articleIdx]);

            res.status(200).send({});
        }));

//게시글 검색
router.get("/all/search",
    regexCheck([["categoryIdx", nonNegativeNumberRegex], ["searchText", textMax50]]),
    dataCheck("SELECT name FROM category WHERE idx = ?", ["categoryIdx"], "존재하지 않는 카테고리입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { categoryIdx } = req.query;
            const { searchText } = req.body;

            const sql = "SELECT account.list.name, article.list.idx, article.list.user_idx, article.list.category_idx, article.list.title FROM article.list INNER JOIN account.list ON article.list.user_idx = account.list.idx WHERE article.list.title LIKE $1 OR article.list.content LIKE $2 AND article.list.category_idx=$3";
            const result = await client.query(sql, [searchText, searchText, categoryIdx])

            res.status(200).send({
                "data": result.rows
            });
        }));

//게시글 좋아요 생성
router.post("/:articleIdx/like",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT * FROM article.list WHERE idx=$1", ["articleIdx"], "존재하지 않는 게시글입니다."),
    duplicateCheck("SELECT idx FROM article.like WHERE user_idx=$1 AND article_idx=$2", "like", ["idx", "articleIdx"]),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.params;

            const sql = "INSERT INTO article.like(user_idx,article_idx) VALUES($1,$2)";
            await client.query(sql, [idx, articleIdx]);

            res.status(200).send({});
        }));

//게시글 좋아요 삭제
router.delete("/:articleIdx/like",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT * FROM article.list WHERE idx=$1", ["articleIdx"], "존재하지 않는 게시글입니다."),
    dataCheck("SELECT idx FROM article.like WHERE user_idx=$1 AND article_idx=$2", ["idx", "articleIdx"], "이미 좋아요가 존재합니다."),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.params;

            const sql = "DELETE FROM article.like WHERE user_idx=$1 AND article_idx=$2";
            await client.query(sql, [idx, articleIdx])

            res.status(200).send({});
        }));

module.exports = router;