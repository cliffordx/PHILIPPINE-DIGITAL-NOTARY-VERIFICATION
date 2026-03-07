import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} ${response.statusCode} - ${duration}ms - ${ip}`,
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const status =
            err instanceof Error && 'status' in err
              ? (err as { status: number }).status
              : 500;
          this.logger.warn(
            `${method} ${url} ${status} - ${duration}ms - ${ip}`,
          );
        },
      }),
    );
  }
}
