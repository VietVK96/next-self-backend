import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidationDto } from '../dto/validation.dto';
import crypto from 'crypto';
import * as phpPassword from 'node-php-password';
import { SessionService } from './session.service';
import { LoginRes } from '../reponse/token.res';
import { Request } from 'express';

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private sessionService: SessionService,
  ) {}

  /**
   * File: auth\validation.php 30-84
   * @function main function
   *
   */
  async validation(payload: ValidationDto): Promise<LoginRes> {
    const user = await this.userRepo.findOne({
      where: {
        log: payload.username,
      },
    });
    if (!user) {
      throw new CBadRequestException(ErrorCode.CAN_NOT_LOGIN);
    }

    /**
     * Start logic CheckPassword
     * File: application\Repositories\User.php 118 -> 153
     *
     */

    if (!user.passwordHash) {
      const shasum = crypto.createHash('sha1');
      const passwordHash = shasum.update(payload.password).digest('hex');
      if (passwordHash !== user.password) {
        throw new CBadRequestException(ErrorCode.CAN_NOT_LOGIN);
      }
      user.password = phpPassword.hash(payload.password);
      // user.passwordHash = true;
      user.passwordHash = Number(true);
      await this.userRepo.save(user);
    } else {
      if (!phpPassword.verify(payload.password, user.password)) {
        throw new CBadRequestException(ErrorCode.CAN_NOT_LOGIN);
      }
      if (
        phpPassword.needsRehash(user.password, 'PASSWORD_DEFAULT', { cost: 10 })
      ) {
        user.password = phpPassword.hash(payload.password);
        await this.userRepo.save(user);
      }
    }

    // Replace session to jwt token
    return await this.sessionService.createTokenLogin({ user });
  }
}
