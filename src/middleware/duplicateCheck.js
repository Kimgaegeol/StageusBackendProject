const tcWrapper = require("../module/tcWrapper"); // trycatch wrapper
const client = require("./../config/postgresql"); // psql
const customError = require("./../module/customError");

const duplicateCheck = (sql, name, valueList) => {
  return tcWrapper(async (req, res, next) => {
    const resultList = valueList.map(
      (elem) =>
        req.body[elem] ||
        req.query[elem] ||
        req.params[elem] ||
        req.decoded[elem]
    );

    const result = await client.query(sql, resultList);

    if (result.rows.length > 0) throw customError(name, 409);

    next();
  });
};

module.exports = duplicateCheck;
