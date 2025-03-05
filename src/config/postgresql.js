const { Pool } = require("pg");

//db 연결 설정
const client = new Pool({
  user: "ubuntu",
  password: process.env.PGSQL_PW,
  host: "localhost",
  database: "articleproject",
  port: 5432,
  max: 10,
});

client.connect();

module.exports = client;
