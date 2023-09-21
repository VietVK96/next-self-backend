import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EntityManager } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { BcbDto } from '../dto/bcb.dto';
import { ClaudeBernardService } from './claudeBernard.Service';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class BcbServices {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private claudeBernardService: ClaudeBernardService,
  ) {}
  //ecoophp/php/bcb/findAll.php
  async findAll(payload: BcbDto) {
    try {
      this.claudeBernardService.setIdPS(payload?.license?.toString());
      const claudeBernardSearchResult = await this.claudeBernardService?.call();
      delete payload?.license;
      const result = new Promise((resolve, reject) => {
        claudeBernardSearchResult.rechercheBCB(
          {
            key: {
              codeEditeur: this.claudeBernardService.codeEditeur,
              idPS: this.claudeBernardService.idPS,
              secretEditeur: this.claudeBernardService.generateKey(),
            },
            ...payload,
          },
          (error, res) => {
            if (error) {
              reject(error); // Handle the error appropriately
            } else {
              resolve(res); // Process the SOAP response
            }
          },
        );
      });
      return await result;
    } catch (error) {
      throw new CBadRequestException(ErrorCode.NOT_FOUND);
    }
  }
}
