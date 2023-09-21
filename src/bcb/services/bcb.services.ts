import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { EntityManager } from 'typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { BcbDto } from '../dto/bcb.dto';
import { ClaudeBernardService } from './claudeBernard.Service';

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
      const claudeBernardSearchResult = await this.claudeBernardService.call({
        baseLocation: payload?.baseLocation,
        query: payload?.query,
        type: payload?.type,
      });
      const result: any[] = [];
      const data = claudeBernardSearchResult?.data;
      if (data) {
        for (const key in data) {
          if (Array.isArray(data[key])) {
            data[key]?.forEach((produit) => {
              result.push({
                ...produit,
                listName: key,
              });
            });
          } else if (typeof data[key] === 'object') {
            data.push({ ...data[key], listName: key });
          }
          result;
        }

        return result;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  }
}
