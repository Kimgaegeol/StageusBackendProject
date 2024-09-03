const tcWrapper = (requestHandler) => {
    return async (req,res, next) => {
        try {
            await requestHandler(req,res);
        } catch(e) {
            next(e);
        }
    }
}

module.exports = tcWrapper;