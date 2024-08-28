const error = require("./../module/customError");
const { customError, errorLogic } = error;

const loginCheck = (req,res, next) => {
    const { idx } = req.session;
    try {
        if(!idx) throw customError("세션 만료", 401);
        next();
    } catch(e) {
        errorLogic(res,e);
    }
}

module.exports = loginCheck;