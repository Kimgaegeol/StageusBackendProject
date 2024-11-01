const tcWrapper = (requestHandler) => { // 그냥 tryCatchWrapper가 더 이쁠 수 있다.
    return async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = tcWrapper;