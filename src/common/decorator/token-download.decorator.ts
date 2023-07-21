import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from '@nestjs/passport';
import { JWT_SECRET_DOWNLOAD } from 'src/constants/jwt';
import { UserIdentity } from './auth.decorator';

@Injectable()
export class TokenDownloadGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const token = request?.query?.td || '';
    if (token === '') {
      throw new UnauthorizedException('Can not get token download');
    }

    try {
      const u = jwt.verify(token, JWT_SECRET_DOWNLOAD, {
        ignoreExpiration: process.env.NODE_ENV === 'development',
      }) as UserIdentity;
      if (u['type'] !== 'download') {
        return false;
      }

      request.user = u;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Token download is expired');
    }
  }

  getRequest<T = any>(context: ExecutionContext): T {
    return context.switchToHttp().getRequest();
  }
}
