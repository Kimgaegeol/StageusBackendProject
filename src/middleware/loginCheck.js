const customError = require("./../module/customError");

const loginCheck = (req,res, next) => {
    const { idx } = req.session.user;
    try {
        if(!idx) throw customError("세션 만료", 401);
        next();
    } catch(e) {
        next(e);
    }
}

module.exports = loginCheck;