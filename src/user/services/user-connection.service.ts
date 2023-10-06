import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserConnectionEntity } from 'src/entities/user-connection.entity';
import { Repository } from 'typeorm';
import { UserConnectionDto } from '../dto/user-connectio.dto';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ErrorCode } from 'src/constants/error';
@Injectable()
export class UserConnectionService {
  constructor(
    @InjectRepository(UserConnectionEntity)
    private readonly userConnectionRepo: Repository<UserConnectionEntity>,
  ) {}
  paginate(page: number, size: number) {
    const _take = size || 50;
    const _skip = page ? (page - 1) * _take : 0;
    return {
      take: _take,
      skip: _skip,
    };
  }

  //File /fsd/users/connections.php
  async findLastConnectionsOfUser(
    userId: number,
    page: number,
    maxPerPage: number,
  ): Promise<UserConnectionDto> {
    const { skip, take } = this.paginate(page, maxPerPage);
    console.log(skip, take);
    try {
      const queryBuilder =
        this.userConnectionRepo.createQueryBuilder('connection');
      queryBuilder.select([
        'connection.id',
        'connection.ipAddress',
        'connection.httpUserAgent',
        'connection.createdAt',
      ]);
      queryBuilder.where('connection.user = :userId', { userId });
      queryBuilder.orderBy('connection.createdAt', 'DESC');
      queryBuilder.skip(skip);
      queryBuilder.take(take);

      const result = await queryBuilder.getManyAndCount();
      return {
        connections: result[0],
        pagination: {
          page: page || 1,
          pagesCount: Math.ceil(result[1] / take),
        },
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  async saveConnection(userId: number, request: Request) {
    const ip = request?.ip?.split(':');
    const userConnection: UserConnectionEntity = {
      usrId: userId,
      sessionId: uuidv4(),
      ipAddress: ip[ip.length - 1],
      httpUserAgent: request.headers['user-agent'],
    };
    await this.userConnectionRepo.save(userConnection);
  }
}
