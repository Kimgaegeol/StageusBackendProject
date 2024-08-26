const mariadb = require("mariadb");

const pool = mariadb.createPool({
    host: "localhost",
    user: "stageus",
    password: "1234",
    database: "article"
});

async function insertData(sql,list) {
    try {
        const connection = await pool.getConnection();
        const result =  await connection.query(sql, list);
        console.log(result.insertId);
        return true;
    } catch(err) {
        console.log(err);
        return err;
    }
}

async function readData(sql,list) {
    try{
        const connection = await pool.getConnection();
        const rows = await connection.query(sql,list);
        console.log(rows);
        return rows;
    } catch(err) {
        console.log(err);
        return err.message;
    }
}

async function updateData(sql,list) {
    try {
        const connection = await pool.getConnection();
        const result =  await connection.query(sql, list);
        console.log(result.affectedRows);
        return true;
    } catch(err) {
        console.log(err);
        return err;
    }
}

async function deleteData(sql,list) {
    try {
        const connection = await pool.getConnection();
        const result =  await connection.query(sql,list);
        console.log(result.affectedRows);
        return true;
    } catch(err) {
        console.log(err);
        return err;
    }
}

module.exports = {insertData, readData, updateData, deleteData}