const customError = require("./../module/customError");

const roleCheck = (req,res, next) => {
    const { gradeIdx } = req.session.user;
    try {
        if(gradeIdx != 1) throw customError("잘못된 접근", 403);
        next();
    } catch(e) {
        next(e);
    }
}

module.exports = roleCheck;