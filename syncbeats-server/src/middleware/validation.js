const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: err.errors ? err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) : err.message
        }
      });
    }
  };
};

module.exports = validateRequest;
