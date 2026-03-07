import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      originalUrl?: string;
      ip?: string;
    }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            method: request.method,
            path: request.originalUrl,
            ip: request.ip,
            durationMs: Date.now() - startedAt,
          }),
        );
      }),
    );
  }
}