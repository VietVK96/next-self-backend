import { BadRequestException, Injectable } from '@nestjs/common';
import { VerifyPasswordDto } from './dto/veiry-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import crypto from 'crypto';
import * as phpPassword from 'node-php-password';

@Injectable()
export class SecuritiesService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async verifyPassword(
    verifyPassWordDto: VerifyPasswordDto,
    request: any,
  ): Promise<any> {
    try {
      const id = request?.user?.id;

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
          throw new BadRequestException('Invalid password');
        }
      } else {
        if (!phpPassword.verify(password, user.password)) {
          throw new BadRequestException('Invalid password');
        }
      }

      return { password_verified: true };
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
