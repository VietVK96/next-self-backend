import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constatns/error';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidationDto } from '../dto/validation.dto';
import crypto from 'crypto';
import * as phpPassword from 'node-php-password';
import { SessionService } from './session.service';
import { LoginRes } from '../reponse/token.res';

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
      user.passwordHash = true;
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
    /**
     * End logic CheckPassword
     *
     */
    // File: auth\validation.php 38-46
    if (!user.validated || user.validated === null) {
      throw new CBadRequestException(ErrorCode.USER_NOT_ACTIVE);
    }
    // End logic
    // @TODO check license from : application\Repositories\User.php 155-171
    // @TODO Save session and check laguage auth\validation.php 56-77

    // Replace session to jwt token
    return await this.sessionService.createTokenLogin({ user });
  }
}