import { BadRequestException, Injectable } from '@nestjs/common';
import { VerifyPasswordDto } from './dto/veiry-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import crypto from 'crypto';
import * as phpPassword from 'node-php-password';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class SecuritiesService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async verifyPassword(
    verifyPassWordDto: VerifyPasswordDto,
    curentUser: UserIdentity,
  ): Promise<any> {
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
        if (passwordHash !== user.password) {
          throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
        }
      } else {
        if (!phpPassword.verify(password, user.password)) {
          throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
        }
      }

      return { password_verified: true };
    } catch (e) {
      throw new CBadRequestException(ErrorCode.INVALID_PASSWORD);
    }
  }
}
