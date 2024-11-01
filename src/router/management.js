const router = require("express").Router();

const client = require("mongodb").MongoClient;

const role = require("./../constant/role");

const tcWrapper = require("../module/tcWrapper");

const loginCheck = require("../middleware/loginCheck");
const roleCheck = require("./../middleware/roleCheck");

const { manager, staff, user } = role; // manager : 1, staff : 2, user : 3

//로그 가져오기
router.get(
    "/log",
    loginCheck,
    roleCheck(manager),
    tcWrapper(
        async (req, res, next) => {
            const connect = await client.connect("mongodb://localhost:27017");

            const data = await connect.db("articleProject").collection("chat").find().toArray();

            res.locals.data = "log";
            res.status(200).send({
                "data": data
            })
        }
    )
)

module.exports = router;