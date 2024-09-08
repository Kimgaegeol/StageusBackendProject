const client = require("./../config/postgresql");

async function insertData(sql,list) {
    try {
        const result =  await client.query(sql, list);
        return true;
    } catch(err) {
        return err;
    }
}

async function readData(sql,list) {
    try{
        const result =  await client.query(sql, list);
        return result.rows;
    } catch(err) {
        return err.message;
    }
}

async function updateData(sql,list) {
    try {
        const result =  await connection.query(sql, list);
        return true;
    } catch(err) {
        return err;
    }
}

async function deleteData(sql,list) {
    try {
        const result =  await connection.query(sql,list);
        return true;
    } catch(err) {
        return err;
    }
}

module.exports = {insertData, readData, updateData, deleteData}