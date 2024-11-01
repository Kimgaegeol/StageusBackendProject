const client = require("./../config/postgresql");
const tcWrapper = require("../module/tcWrapper");
const customError = require("./../module/customError");

const dataCheck = (sql, valueList, message) => {
    return tcWrapper(
        async (req, res, next) => {
            const resultList = valueList.map(elem => req.body[elem] || req.query[elem] || req.params[elem] || req.decoded[elem]);

            const result = await client.query(sql, resultList);

            if (result.rows.length == 0) throw customError(message, 404);

            next();
        }
    )
}

module.exports = dataCheck;
