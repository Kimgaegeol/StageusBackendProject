const customError = require("./../module/customError");
const tcWrapper = require("../module/tcWrapper"); // trycatch wrapper

const roleCheck = (roleType) => {
    return tcWrapper(
        async (req, res, next) => {

            const { role } = req.decoded;

            if (role > roleType) throw customError("잘못된 접근", 403);

            next();
        }
    )
};

module.exports = roleCheck;