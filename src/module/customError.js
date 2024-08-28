const customError = (message,status) => {
    const err = new Error(message);
    err.status = status;
    return err
}

const errorLogic = (res,e) => {
    res.status(e.status || 500).send({
        "status": e.status,
        "message": e.message
    });
}

module.exports = {customError, errorLogic}