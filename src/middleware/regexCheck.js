const error = require("./../module/customError");
const { customError, errorLogic } = error;

const regexCheck = (valueList) => {
    const middleware = (req,res, next) => {
        try {
            valueList.forEach((elem) => {
                const name = elem[0]
                const value = req.body[name] || req.query[name] || req.params[name];
                const regex = elem[1];
                if(!regex.test(value)) throw customError(name,400);
            });

            next();
        } catch(e) {
            errorLogic(res, e);
        }
    }
    return middleware;
}

module.exports = regexCheck;