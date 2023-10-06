import { BadRequestException, Injectable } from '@nestjs/common';

import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as phpPassword from 'node-php-password';
import { UpdatePassWordDto } from '../dtos/user-setting.dto';
import { ErrorCode } from 'src/constants/error';
@Injectable()
export class AccountSecurityService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async updatePasswordAccount(
    id: number,
    updatePassAccountDto: UpdatePassWordDto,
  ) {
    try {
      const userFind = await this.userRepository.findOneOrFail({
        where: { id: id },
      });

      const { password, new_password, confirm_password } = updatePassAccountDto;

      if (!userFind) {
        throw new BadRequestException('Not found user');
      } else if (
        !userFind.passwordHash
          ? phpPassword.verify(password, userFind.password)
          : !(await phpPassword.verify(password, userFind.password))
      ) {
        throw new BadRequestException('Failure_unknown_password');
      } else if (new_password !== confirm_password) {
        throw new BadRequestException(
          'New password and confirmation password do not match',
        );
      } else if (new_password.length < 6) {
        throw new BadRequestException('Invalid new password');
      }
      const newPassword = phpPassword.hash(new_password);
      userFind.password = newPassword;
      userFind.passwordHash = Number(true);

      await this.userRepository.save(userFind);

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw new BadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
