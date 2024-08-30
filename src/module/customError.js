const customError = (message,status) => {
    const err = new Error(message);
    err.status = status;
    return err
}

module.exports = customError;