const errorMiddleware = (err, req, res, next) => {
    console.log(err)
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Something went wrong",
        errors: err.errors || []
    })
}

export { errorMiddleware }
