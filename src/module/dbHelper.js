const client = require("./../config/postgresql");
const customError = require("./../module/customError"); // error 모듈

const dbHelper = async (sql, list) => {
    let result;
    let error;
    try {
        result = await client.query(sql, list);
    } catch (e) {
        error = customError(e.message, 500);
    }
    return { result, error };
}

module.exports = dbHelper