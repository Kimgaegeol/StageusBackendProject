const dbHelper = require("./../module/dbHelper"); // data 모듈
const customError = require("./../module/customError");

const {readData} = dbHelper;


const duplicateCheck = (sql,name,valueList) => {
    const middleware = async (req,res, next) => {
        try {
            const resultList = valueList.map(elem => req.body[elem] || req.query[elem] || req.params[elem])
            console.log(resultList);

            let rows = await readData(sql,resultList);
            if(rows.length > 0) throw customError(name,409);
            
            next();
        } catch(e) {
            next(e);
        }
    }
    return middleware;
}


module.exports = duplicateCheck;