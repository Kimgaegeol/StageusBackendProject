const router = require("express").Router();

const client = require("./../config/postgresql"); // psql

const customError = require("./../module/customError");
const tcWrapper = require("../module/tcWrapper");

const loginCheck = require("../middleware/loginCheck");
const regexCheck = require("../middleware/regexCheck");
const duplicateCheck = require("./../middleware/duplicateCheck");
const roleCheck = require("./../middleware/roleCheck");
const dataCheck = require("./../middleware/dataCheck");

const regex = require("./../constant/regx");
const role = require("./../constant/role");

const { nonNegativeNumberRegex, textMax50 } = regex;
const { manager, staff, user } = role; // manager : 1, staff : 2, user : 3


// 댓글 읽기
router.get("",
    regexCheck([["articleIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT * FROM article.list WHERE idx=$1", ["articleIdx"], "존재하지 않는 게시물입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { articleIdx } = req.query;

            const sql = "SELECT comment.list.*, COUNT(comment.like.*) AS like_comment FROM comment.list LEFT JOIN comment.like ON comment.list.idx = comment.like.comment_idx WHERE article_idx=$1 GROUP BY comment.list.idx";
            const result = await client.query(sql, [articleIdx]);

            res.status(200).send({
                "data": result.rows
            });
        }));

// 댓글 생성
router.post("",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex], ["content", textMax50]]),
    dataCheck("SELECT user_idx FROM article.list WHERE idx=$1", ["articleIdx"], "존재하지 않는 게시물입니다."),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.query;
            const { content } = req.body;

            const sql = "INSERT INTO comment.list(user_idx,article_idx,content) VALUES ($1,$2,$3)";
            await client.query(sql, [idx, articleIdx, content]);

            res.status(200).send({});
        }));

// 댓글 수정
router.put("/:commentIdx",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex], ["commentIdx", nonNegativeNumberRegex], ["content", textMax50]]),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.query;
            const { commentIdx } = req.params;
            const { content } = req.body;
            let sql;

            sql = "SELECT user_idx FROM comment.list WHERE idx=$1";
            const result = await client.query(sql, [commentIdx]);

            if (result.rows.length == 0) throw customError("존재하지 않는 데이터", 404);
            if (result.rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

            sql = "UPDATE comment.list SET content=$1 WHERE idx=$2 AND user_idx=$3 AND article_idx=$4";
            await client.query(sql, [content, commentIdx, idx, articleIdx]);

            res.status(200).send({});
        }));

// 댓글 삭제
router.delete("/:commentIdx",
    loginCheck,
    regexCheck([["articleIdx", nonNegativeNumberRegex], ["commentIdx", nonNegativeNumberRegex]]),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { articleIdx } = req.query;
            const { commentIdx } = req.params;
            let sql;

            sql = "SELECT user_idx FROM comment.list WHERE idx=$1";
            const result = await client.query(sql, [commentIdx]);

            if (result.rows.length == 0) throw customError("존재하지 않는 데이터", 404);
            if (result.rows[0].user_idx != idx) throw customError("잘못된 접근", 403);

            sql = "DELETE FROM comment.list WHERE idx=$1 AND user_idx=$2 AND article_idx=$3";
            await client.query(sql, [commentIdx, idx, articleIdx]);

            res.status(200).send({});
        }));

// 댓글 좋아요 생성
router.post("/:commentIdx/like",
    loginCheck,
    regexCheck([["commentIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT * FROM comment.list WHERE idx=$1", ["commentIdx"], "존재하지 않는 댓글입니다."),
    duplicateCheck("SELECT idx FROM comment.like WHERE user_idx=$1 AND comment_idx=$2", "like", ["idx", "commentIdx"]),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { commentIdx } = req.params;

            const sql = "INSERT INTO comment.like(user_idx,comment_idx) VALUES($1,$2)";
            await client.query(sql, [idx, commentIdx]);

            res.status(200).send({});
        }));

// 댓글 좋아요 삭제
router.delete("/:commentIdx/like",
    loginCheck,
    regexCheck([["commentIdx", nonNegativeNumberRegex]]),
    dataCheck("SELECT * FROM comment.list WHERE idx=$1", ["commentIdx"], "존재하지 않는 댓글입니다."),
    dataCheck("SELECT idx FROM comment.like WHERE user_idx=$1 AND comment_idx=$2", ["idx", "commentIdx"], ".존재하지 않는 댓글의 좋아합니다."),
    tcWrapper(
        async (req, res, next) => {
            const { idx } = req.decoded;
            const { commentIdx } = req.params;

            const sql = "DELETE FROM comment.like WHERE user_idx=$1 AND comment_idx=$2";
            await client.query(sql, [idx, commentIdx])

            res.status(200).send({});
        }));

module.exports = router;