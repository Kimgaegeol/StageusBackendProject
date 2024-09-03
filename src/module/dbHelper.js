const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: "localhost",
    user: "stageus",
    password: "1234",
    database: "article",
    connectionLimit: 50
});
// connection 관련해서 찾아보고 실험해보기!!!!!!
async function insertData(sql,list) {
    let connection
    try {
        connection = await pool.getConnection();
        const result =  await connection.query(sql, list);
        return true;
    } catch(err) {
        return err;
    } finally {
        if(connection) connection.release();
    }
}

async function readData(sql,list) {
    let connection
    try{
        connection = await pool.getConnection();
        const rows = await connection.query(sql,list);
        return rows;
    } catch(err) {
        return err.message;
    } finally {
        if(connection) connection.release();
    }
}

async function updateData(sql,list) {
    let connection
    try {
        connection = await pool.getConnection();
        const result =  await connection.query(sql, list);
        return true;
    } catch(err) {
        return err;
    } finally {
        if(connection) connection.release();
    }
}

async function deleteData(sql,list) {
    let connection
    try {
        connection = await pool.getConnection();
        const result =  await connection.query(sql,list);
        return true;
    } catch(err) {
        return err;
    } finally {
        if(connection) connection.release();
    }
}

module.exports = {insertData, readData, updateData, deleteData}