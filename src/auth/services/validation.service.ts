import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidationDto } from '../dto/validation.dto';
import * as crypto from 'crypto';
import * as phpPassword from 'node-php-password';
import { SessionService } from './session.service';
import { LoginRes } from '../reponse/token.res';
import { RegisterDto } from '../dto/resgister.dto';

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
  async validation(payload: ValidationDto) {
    const user = await this.userRepo.findOne({
      where: {
        email: payload.email,
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

    if (!phpPassword.verify(payload.password, user.password)) {
      throw new CBadRequestException(ErrorCode.CAN_NOT_LOGIN);
    }
    if (
      phpPassword.needsRehash(user.password, 'PASSWORD_DEFAULT', { cost: 10 })
    ) {
      user.password = phpPassword.hash(payload.password);
      try {
        await this.userRepo.save(user);
      } catch (error) {
        console.log(error);
      }
    }

    // Replace session to jwt token
    const token = await this.sessionService.createTokenLogin({ user });
    return {
      token,
      user,
    };
  }

  async register(payload: RegisterDto) {
    const { email, name, password } = payload;
    await this.userRepo.save({
      name,
      email,
      password: phpPassword.hash(password),
      log: email,
    });
    return 'success';
  }
}
