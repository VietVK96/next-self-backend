import { HttpException, HttpStatus } from '@nestjs/common';

export class CNotFoundRequestException extends HttpException {
  constructor(
    message: string,
    objectOrError?: string | object | any,
    description = 'Bad Request',
  ) {
    const data = {
      msg: message,
      data: objectOrError,
    };
    super(
      HttpException.createBody(data, description, HttpStatus.NOT_FOUND),
      HttpStatus.NOT_FOUND,
    );
  }
}
