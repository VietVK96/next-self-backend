import { Injectable } from '@nestjs/common';
import { VerifyPasswordDto } from './dto/veiry-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import crypto from 'crypto';
import * as phpPassword from 'node-php-password';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { VerifyPasswordRes } from './res/services/verify-password.res';

@Injectable()
export class SecuritiesService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async verifyPassword(
    verifyPassWordDto: VerifyPasswordDto,
    curentUser: UserIdentity,
  ): Promise<VerifyPasswordRes> {
    try {
      const id = curentUser?.id;
      const { password } = verifyPassWordDto;
      const user = await this.userRepository.findOne({
        where: {
          id: id,
        },
      });

      //Verify the password matches
      if (!user.passwordHash) {
        const shasum = crypto.createHash('sha1');
        const passwordHash = shasum.update(password).digest('hex');
        if (passwordHash !== user.passwordAccounting) {
          throw new CBadRequestException(ErrorCode.INVALID_PASSWORD_ACCOUNTING);
        }
      } else {
        if (!phpPassword.verify(password, user.passwordAccounting)) {
          throw new CBadRequestException(ErrorCode.INVALID_PASSWORD_ACCOUNTING);
        }
      }

      return { password_verified: true };
    } catch (e) {
      throw new CBadRequestException(ErrorCode.INVALID_PASSWORD_ACCOUNTING);
    }
  }

  /**
   * File php: php/securities/password-accounting/index.php line 10 -> 28
   */
  async hasPasswordAccounting(id: number) {
    try {
      const userFind = await this.userRepository.findOneOrFail({
        where: { id: id },
      });
      if (userFind) return { confirm_password: !!userFind?.passwordAccounting };
      throw new CBadRequestException(ErrorCode.NOT_FOUND_USER);
    } catch (err) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }
}
