const errorHandler = (e, req,res, next) => {
    console.error(e.stack);

    res.status(e.status || 500).send({
        "status": e.status,
        "message": e.message
    });
}

module.exports = errorHandler;