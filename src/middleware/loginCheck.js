const customError = require("./../module/customError");

const loginCheck = (req,res, next) => {
    try {
        if(!req.session.user) throw customError("세션 만료", 401);
        next();
    } catch(e) {
        next(e);
    }
}

module.exports = loginCheck;