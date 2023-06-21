import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWT_SECRET } from 'src/constants/jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: process.env.NODE_ENV === 'development',
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return payload;
  }
  //   const grants = this.rolesBuilder.getGrants();

  //   const role = payload?.role || '';
  //   if (role === '') {
  //     return {
  //       ...payload,
  //       pers: [],
  //     };
  //   }
  //   const userRole = grants[role];
  //   return {
  //     ...payload,
  //     pers: userRole,
  //   };
  // }
}
