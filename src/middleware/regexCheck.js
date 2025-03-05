const customError = require("./../module/customError");
const tcWrapper = require("../module/tcWrapper"); // trycatch wrapper

const regexCheck = (valueList) => {
  return tcWrapper((req, res, next) => {
    valueList.forEach((elem) => {
      const name = elem[0];
      const value = req.body[name] || req.query[name] || req.params[name];
      const regex = elem[1];
      if (!regex.test(value)) throw customError(name, 400);
    });

    next();
  });
};

module.exports = regexCheck;
