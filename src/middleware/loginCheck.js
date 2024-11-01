const customError = require("./../module/customError");
const jwt = require("jsonwebtoken");

const loginCheck = (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization) throw customError("로그인 필요", 401);

        req.decoded = jwt.verify(authorization, process.env.JWT_SIGNATURE_KEY);

        next();
    } catch (e) {
        if (e.name === "TokenExpiredError" ||
            e.name === "JsonWebTokenError") {
            e.status = 401
        }
        next(e);
    }
}

module.exports = loginCheck;