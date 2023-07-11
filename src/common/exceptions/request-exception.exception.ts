import { HttpException, HttpStatus } from '@nestjs/common';

export class RequestException extends HttpException {
  constructor(
    message: string,
    objectOrError?: string | object | any,
    description = 'Internal server error',
  ) {
    const data = {
      msg: message,
      data: objectOrError,
    };
    super(
      HttpException.createBody(
        data,
        description,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
