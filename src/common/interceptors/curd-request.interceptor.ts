import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class CCrudRequestInterceptor implements NestInterceptor {
  private s: any;
  constructor(s: any) {
    this.s = s;
  }
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    // req.query = {
    //   ...req.query,
    //   exclude: ['name'],
    // };
    // req.NESTJSX_PARSED_CRUD_REQUEST_KEY.options.query = {
    //   ...req.NESTJSX_PARSED_CRUD_REQUEST_KEY.options.query,
    //   exclude: [...req.NESTJSX_PARSED_CRUD_REQUEST_KEY.options.query.exclude, 'name'],
    // };
    req.NESTJSX_PARSED_CRUD_REQUEST_KEY.options.query = this.s(
      req.user,
      req.NESTJSX_PARSED_CRUD_REQUEST_KEY.options.query,
    );
    return next.handle();
  }
}
