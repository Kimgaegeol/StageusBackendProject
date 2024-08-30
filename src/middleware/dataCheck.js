const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError");

const {readData} = dbHelper;


const dataCheck = (sql,valueList,message) => {
    const middleware = async (req,res, next) => {
        try {
            const resultList = valueList.map(elem => req.body[elem] || req.query[elem] || req.params[elem])

            let rows = await readData(sql,resultList);
            if(rows.length == 0) throw customError(message,404);
            
            next();
        } catch(e) {
            next(e);
        }
    }
    return middleware;
}


module.exports = dataCheck;
