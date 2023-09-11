import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DEFAULT_LANGUAGE } from 'src/constants/default';
import { JWT_LOG_OUT, JWT_RF_LOG_OUT, JWT_SECRET } from 'src/constants/jwt';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { LoginRes } from '../reponse/token.res';
import { RefreshJwt, UserIdentity } from 'src/common/decorator/auth.decorator';
import { ErrorCode } from 'src/constants/error';
import * as dayjs from 'dayjs';
import { LogoutDto } from '../dto/logout.dto';
import { ResourceEntity } from 'src/entities/resource.entity';
import { UserResourceEntity } from 'src/entities/user-resource.entity';
import { LicenseEntity } from 'src/entities/license.entity';
import { GetSessionService } from './get-session.service';

@Injectable()
export class SessionService {
  private readonly logger: Logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    protected cacheManager: Cache,
    private getSessionService: GetSessionService,
  ) {}

  async createTokenLogin({
    user,
    lang,
    oldRefreshToken,
  }: {
    user: UserEntity;
    lang?: string;
    oldRefreshToken?: string;
  }): Promise<LoginRes> {
    const practitioners = await this.getSessionService.getPractitioners(
      user?.id,
      user?.organizationId,
    );
    const doctorIds = practitioners.map((r) => r.id);

    const payloadSign: UserIdentity = {
      id: user.id,
      type: 'auth',
      sub: user.log,
      dis: doctorIds,
      org: user.organizationId,
      lang: lang ?? DEFAULT_LANGUAGE,
    };

    const token = this.jwtService.sign(payloadSign);
    const decode = this.jwtService.decode(token);

    let refreshToken: string = oldRefreshToken;
    let needRefresh = true;
    if (oldRefreshToken && oldRefreshToken !== '') {
      const u = jwt.verify(oldRefreshToken, JWT_SECRET) as RefreshJwt;
      if (u.type !== 'refresh') {
        throw new UnauthorizedException(ErrorCode.FRESH_TOKEN_WRONG);
      }
      const now = dayjs().subtract(1, 'day');
      if (now.unix() < u.exp) {
        needRefresh = false;
      }
    }

    if (needRefresh) {
      const payloadRefreshToken: RefreshJwt = {
        id: user.id,
        sub: user.log,
        type: 'refresh',
      };
      refreshToken = this.jwtService.sign(payloadRefreshToken, {
        expiresIn: '7d',
      });
    }
    return {
      accessToken: token,
      refreshToken: refreshToken,
      expiresIn: 3600,
      expiresAt: decode['exp'],
    };
  }

  async refreshToken(payload: RefreshTokenDto): Promise<LoginRes> {
    let u: RefreshJwt = null;
    try {
      u = jwt.verify(payload.refreshToken, JWT_SECRET) as RefreshJwt;
    } catch (e) {
      throw new UnauthorizedException(ErrorCode.FRESH_TOKEN_WRONG);
    }

    const logout = await this.cacheManager.get(
      `${JWT_RF_LOG_OUT}.${payload.refreshToken}`,
    );
    if (logout === JWT_RF_LOG_OUT) {
      throw new UnauthorizedException(ErrorCode.FRESH_TOKEN_WRONG);
    }
    if (u.type !== 'refresh') {
      throw new UnauthorizedException(ErrorCode.FRESH_TOKEN_WRONG);
    }

    const user = await this.userRepo.findOne({
      where: {
        id: u.id,
      },
    });
    if (!user) {
      throw new UnauthorizedException(ErrorCode.CAN_NOT_LOGIN);
    }

    if (!user.validated || user.validated === null) {
      throw new UnauthorizedException(ErrorCode.USER_NOT_ACTIVE);
    }
    return await this.createTokenLogin({
      user,
      lang: DEFAULT_LANGUAGE,
      oldRefreshToken: payload.refreshToken,
    });
  }

  async deleteToken(payload: LogoutDto): Promise<void> {
    // Logout jwt token
    try {
      const decode = this.jwtService.decode(payload.token) as UserIdentity;
      // 60 is 1 minute for time clear after lifeTime jwt
      const lifeTime = dayjs().unix() - decode.exp + 60;

      await this.cacheManager.set(
        `${JWT_LOG_OUT}.${payload.token}`,
        JWT_LOG_OUT,
        lifeTime * 1000,
      );
    } catch (e) {
      this.logger.log(e);
    }
    //Logout refresh token
    try {
      const decode = this.jwtService.decode(payload.rfToken) as RefreshJwt;
      // 60 is 1 minute for time clear after lifeTime jwt
      const lifeTime = dayjs().unix() - decode.exp + 60;

      await this.cacheManager.set(
        `${JWT_RF_LOG_OUT}.${payload.rfToken}`,
        JWT_RF_LOG_OUT,
        lifeTime * 1000,
      );
    } catch (e) {
      this.logger.log(e);
    }
  }
}
