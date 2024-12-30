const handleError = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Something went wrong';
  
    console.error({
      status,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date()
    });
  
    const response = {
      error: {
        message,
        status,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
    };
  
    res.status(status).json(response);
  };
  
  module.exports = { handleError };