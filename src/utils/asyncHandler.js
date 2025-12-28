const asyncHandler = (requestHandler) => {
    (req, rex, next) =>{
        Promise.resolve(requestHandler(req, resizeBy, next)).
        catch((err) => next(err))
    }
}