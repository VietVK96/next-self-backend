import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { DEFAULT_LANGUAGE } from 'src/constatns/default';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { LoginRes } from '../reponse/token.res';

@Injectable()
export class SessionService {
  private readonly logger: Logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    protected cacheManager: Cache,
  ) {}

  async createTokenLogin({
    user,
    lang,
  }: {
    user: UserEntity;
    lang?: string;
  }): Promise<LoginRes> {
    const payloadRefreshToken = {
      sub: user.id,
    };
    const payloadSign = {
      sub: user.id,
      un: user.log,
      org: user.organizationId,
      lang: lang ?? DEFAULT_LANGUAGE,
    };

    const token = this.jwtService.sign(payloadSign);
    const decode = this.jwtService.decode(token);
    const refreshToken = this.jwtService.sign(payloadRefreshToken, {
      expiresIn: '7d',
    });
    return {
      accessToken: token,
      refreshToken: refreshToken,
      expiresIn: 3600,
      expiresAt: decode['exp'],
    };
  }

  // async refreshToken(payload: RefreshDto): Promise<LoginRes> {
  //   const tokens = payload.refreshToken.split('.');
  //   if (!tokens || tokens.length !== 2) {
  //     throw new CBadRequestException(ErrorCode.REFRESH_TOKEN_WRONG);
  //   }
  //   const session = await this.sessionRepo.findOne({
  //     where: {
  //       userId: tokens[1],
  //       refreshToken: payload.refreshToken,
  //       deletedAt: IsNull(),
  //     },
  //   });
  //   if (!session) {
  //     throw new CBadRequestException(ErrorCode.REFRESH_TOKEN_WRONG);
  //   }
  //   const user = await this.userRepo.findOne({
  //     where: {
  //       id: session.userId,
  //     },
  //     relations: ['role'],
  //   });
  //   const refreshToken = `${makeRandomString(60, 'Aa#')}.${user.id}`;
  //   const payloadSign = {
  //     sub: user.id,
  //     un: user.username,
  //     role: user?.role?.id || '',
  //   };
  //   const token = this.jwtService.sign(payloadSign);
  //   await this.sessionRepo.update(session.id, {
  //     refreshToken,
  //     token,
  //     updatedAt: new Date(),
  //   });
  //   const decode = this.jwtService.decode(token);
  //   return {
  //     accessToken: token,
  //     refreshToken: refreshToken,
  //     expiresIn: 3600,
  //     expiresAt: decode['exp'],
  //   };
  // }

  // async deleteToken(payload: LogoutDto): Promise<void> {
  //   const decode = this.jwtService.decode(payload.token);
  //   const session = await this.sessionRepo.findOne({
  //     where: {
  //       userId: decode['sub'],
  //       token: payload.token,
  //       deletedAt: IsNull(),
  //     },
  //   });

  //   if (session) {
  //     await this.sessionRepo.update(session.id, { deletedAt: new Date() });
  //     await this.cacheManager.set(
  //       `${JWT_LOG_OUT}.${payload.token}`,
  //       JWT_LOG_OUT,
  //     );
  //   }
  // }

  // async deleteAllToken(userId: string): Promise<void> {
  //   const sessions = await this.sessionRepo.find({
  //     where: {
  //       userId,
  //       deletedAt: IsNull(),
  //     },
  //   });
  //   if (sessions && sessions.length > 0) {
  //     for (const s of sessions) {
  //       await this.cacheManager.set(`${JWT_LOG_OUT}.${s.token}`, JWT_LOG_OUT);
  //     }
  //   }
  //   await this.sessionRepo.update(
  //     {
  //       userId,
  //     },
  //     {
  //       deletedAt: new Date(),
  //     },
  //   );
  // }
}
