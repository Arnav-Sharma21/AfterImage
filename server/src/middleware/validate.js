import { AppError } from './errors.js';

export function validate(schema, target = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] || 'form';
        fieldErrors[field] ??= issue.message;
      }
      return next(new AppError(422, 'VALIDATION_ERROR', 'Check the highlighted fields.', fieldErrors));
    }
    req.validated ??= {};
    req.validated[target] = result.data;
    next();
  };
}
