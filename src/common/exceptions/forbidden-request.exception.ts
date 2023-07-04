import { HttpException, HttpStatus } from '@nestjs/common';

export class CForbiddenRequestException extends HttpException {
  constructor(
    message: string,
    objectOrError?: string | object | any,
    description = 'Forbidden',
  ) {
    const data = {
      msg: message,
      data: objectOrError,
    };
    super(
      HttpException.createBody(data, description, HttpStatus.FORBIDDEN),
      HttpStatus.FORBIDDEN,
    );
  }
}
