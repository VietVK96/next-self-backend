import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ErrorCode } from 'src/constants/error';
import { CBadRequestException } from '../exceptions/bad-request.exception';
import { UserIdentity } from './auth.decorator';

export const CurrentDoctor = createParamDecorator(
  (_, context: ExecutionContext) => {
    const {
      user,
      headers,
    }: { user: UserIdentity; headers: Record<string, string> } = context
      .switchToHttp()
      .getRequest();
    console.log('headers', headers, user.dis);
    const doctorId = parseInt(headers['x-doctorid']);
    if (!doctorId || !user.dis.includes(doctorId)) {
      throw new CBadRequestException(ErrorCode.YOU_NOT_HAVE_DOCTOR);
    }
    return doctorId;
  },
);
