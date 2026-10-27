import { expect, it, vi } from 'vitest';
import { errorHandler } from '../src/middleware/errors.js';

it('delegates an already-started response instead of sending JSON twice', () => {
  const error = new Error('response already started');
  const res = { headersSent: true, status: vi.fn() };
  const next = vi.fn();
  errorHandler(error, {}, res, next);
  expect(next).toHaveBeenCalledWith(error);
  expect(res.status).not.toHaveBeenCalled();
});

it('does not write to a disconnected browser response', () => {
  const res = { destroyed: true, status: vi.fn() };
  const next = vi.fn();
  errorHandler(new Error('disconnected'), {}, res, next);
  expect(res.status).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
});
