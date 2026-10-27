export class AppError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function notFound(_req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', 'This resource could not be found.'));
}

export function errorHandler(error, req, res, next) {
  // Navigation can cancel an asset/API response. Never write a second response
  // or log a normal disconnected request as an application failure.
  if (res.destroyed || req.aborted) return;
  if (res.headersSent) return next(error);
  let failure = error;
  if (error.name === 'MulterError') failure = new AppError(error.code === 'LIMIT_FILE_SIZE' ? 413 : 422, 'UPLOAD_LIMIT', error.code === 'LIMIT_FILE_SIZE' ? 'Use an image smaller than 8 MB.' : 'Upload one image at a time, using the image field.');
  if (error.type === 'entity.parse.failed') failure = new AppError(400, 'INVALID_JSON', 'Send a valid JSON request.');
  if (error.type === 'entity.too.large') failure = new AppError(413, 'BODY_TOO_LARGE', 'The request is too large.');
  if (error.code === 11000) failure = new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists. Sign in instead.');
  if (['MongoServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError', 'MongooseServerSelectionError'].includes(error.name)) {
    failure = new AppError(503, 'DATABASE_UNAVAILABLE', 'The database is unavailable. Please try again shortly.');
  }
  const status = failure instanceof AppError ? failure.status : 500;
  if (status >= 500) {
    // Never log request bodies, credentials, database URIs, or raw driver errors.
    console.error(JSON.stringify({ requestId: req.id, status, code: failure.code || 'INTERNAL_ERROR' }));
  }
  res.status(status).json({ error: {
    code: failure instanceof AppError ? failure.code : 'INTERNAL_ERROR',
    message: failure instanceof AppError ? failure.message : 'Something went wrong. Please try again.',
    ...(failure.fieldErrors ? { fieldErrors: failure.fieldErrors } : {}),
    requestId: req.id
  } });
}
