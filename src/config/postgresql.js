const { Pool } = require("pg");

//db 연결 설정
const client = new Pool({
    "user": "ubuntu",
    "password": "1234",
    "host": "localhost",
    "database": "web",
    "port": 5432,
    "max": 5
});

client.connect();

module.exports = client;