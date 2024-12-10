import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  createParamDecorator,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Cache } from 'cache-manager';
import { JwtPayload } from 'jsonwebtoken';
import { JWT_LOG_OUT } from 'src/constants/jwt';
export interface UserIdentity extends JwtPayload {
  id: number;
  un?: string;
  type?: string;
}

export interface RefreshJwt extends JwtPayload {
  id: number;
  sub: string;
  type?: string;
}

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext) => {
    const { user } = context.switchToHttp().getRequest();
    return user;
  },
);

@Injectable()
export class TokenGuard extends AuthGuard('jwt') {
  @Inject(CACHE_MANAGER)
  protected cacheManager: Cache;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    let authorization = request.headers?.authorization;
    if (!authorization || authorization === '') {
      if (!request?.query?.token || request?.query?.token === '') {
        throw new UnauthorizedException();
      }
      authorization = `Bearer ${request?.query?.token}`;
    }
    const tokens = authorization.split(' ');
    if (!tokens || tokens.length !== 2) {
      throw new UnauthorizedException();
    }

    const value = await this.cacheManager.get(`${JWT_LOG_OUT}.${tokens[1]}`);
    if (value && value === JWT_LOG_OUT) {
      throw new UnauthorizedException();
    }
    const x = await super.canActivate(context);
    if (!x) {
      throw new UnauthorizedException();
    }
    this.getRequest(context);

    return true;
  }

  getRequest<T = any>(context: ExecutionContext): T {
    return context.switchToHttp().getRequest();
  }
}
