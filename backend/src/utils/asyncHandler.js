const asyncHandler = (fn) => async (req, res, next) => {
    try {
        return await Promise.resolve(fn(req, res, next));
    } catch (error) {
        return next(error);
    }
};

export default asyncHandler;
