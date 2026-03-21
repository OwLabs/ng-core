import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // We handle the request and then map the result
    return next.handle().pipe(
      map((data) => {
        // Here 'data' is whatever our Controller returned
        return {
          success: true,
          statusCode: context.switchToHttp().getResponse().statusCode,
          data: data,
        };
      }),
    );
  }
}
