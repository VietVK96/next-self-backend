import {
  CACHE_MANAGER,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_LOG_OUT } from 'src/constatns/jwt';

export interface UserIdentity {
  sub: string;
  un?: string;
  role?: number;
  type?: string;
  pers?: string[];
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

    const authorization = request.headers?.authorization;
    if (!authorization || authorization === '') {
      throw new UnauthorizedException();
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
    return true;
  }

  getRequest<T = any>(context: ExecutionContext): T {
    return context.switchToHttp().getRequest();
  }
}
