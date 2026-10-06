import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  logger.error(`Error processing ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
  });

  const statusCode = err.statusCode || (err.name === 'UnauthorizedError' ? 401 : 500);
  const message = err.isOperational ? err.message : (statusCode === 500 ? 'Internal server error occurred' : err.message);

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
  });
};
