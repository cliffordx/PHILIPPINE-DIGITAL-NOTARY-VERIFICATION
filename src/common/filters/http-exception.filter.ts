import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      let message = 'Unexpected error';
      if (typeof payload === 'string') {
        message = payload;
      } else if (typeof payload === 'object' && payload && 'message' in payload) {
        const value = (payload as { message?: string | string[] }).message;
        message = Array.isArray(value) ? value.join(', ') : (value ?? message);
      }

      return response.status(status).json({
        status: 'error',
        code: HttpStatus[status] || 'ERROR',
        message,
      });
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unhandled exception',
      exception instanceof Error ? exception.stack : undefined,
    );

    return response.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }
}