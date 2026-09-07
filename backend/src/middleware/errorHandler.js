// Central error handler so API errors look consistent and useful.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode
    || (err.code === '23505' ? 409 : null)
    || (err.code === '23503' ? 400 : null)
    || (err.code === '23514' ? 400 : null)
    || (err.name === 'SyntaxError' ? 400 : 500);

  if (status >= 500) {
    console.error(err);
  }

  const response = {
    message: err.message || 'Internal server error',
    status
  };

  if (process.env.NODE_ENV !== 'production' && status >= 500) {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
};

module.exports = { errorHandler };
