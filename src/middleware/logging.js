const client = require("mongodb").MongoClient;

const logging = async (req, res, next) => {
    try {
        if (!req.method) next();

        res.on('finish', async () => {
            const now = Date.now()
            const date = new Date(now);

            let userIdx = req.decoded ? req.decoded.idx : null; // 삼항연산자

            const insertData = {
                "method": req.method,
                "entryPoint": `${req.path}`,
                "idx": userIdx,
                "statusCode": res.statusCode,
                "time": `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                "body": req.body || null,
                "query": req.query || null,
                "params": req.params || null,
                "res": res.locals.data || null
            }

            console.log(insertData);

            const connect = await client.connect("mongodb://localhost:27017");
            await connect.db("articleProject").collection("chat").insertOne(insertData);
        })
        next();
    }
    catch (e) {
        next(e);
    }
}

module.exports = logging;