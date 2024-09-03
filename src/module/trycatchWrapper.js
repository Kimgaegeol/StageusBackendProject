const trycatchWrapper = (func) => {
    try{
        func(req,res, next);
    }
    catch(e) {
        func.next(e);
    }
}

module.exports = trycatchWrapper;