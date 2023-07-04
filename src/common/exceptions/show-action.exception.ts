import { ExceptionFilter, Catch, HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

// application/Controller/ExceptionController.php Line:32->41.
@Catch()
export class ShowActionExceptionFilter implements ExceptionFilter {
  catch(exception: Error): any {
    const code =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      status_code: code,
      status_text: code >= 400 && code <= 599 ? HttpStatus[code] : '',
      exception: exception,
    };

    return responseBody;
  }
}
