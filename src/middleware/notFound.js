const notFoundMiddleware = (req,res,next) => {
    res.status(404).send({
        "message" : "해당 API가 존재하지 않습니다."
    });
}

module.exports = notFoundMiddleware;