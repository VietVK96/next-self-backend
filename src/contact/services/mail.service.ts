import { Injectable } from '@nestjs/common';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { DataRes, FindAllMailRes } from '../response/findAll.mail.res';
import { FindAllMailDto } from '../dto/findAll.mail.contact';
import { InjectRepository } from '@nestjs/typeorm';
import { LettersEntity } from 'src/entities/letters.entity';
import * as dayjs from 'dayjs';

interface LetterI {
  id: number;
  doctor_id: number;
  title: string;
  type: string;
  favorite: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class MailService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(LettersEntity)
    private readonly repo: Repository<LettersEntity>,
  ) {}

  async findAll(payload: FindAllMailDto) {
    const [statements, count] = await this.repo.findAndCount({
      where: {
        conId: Number(payload?.id),
      },
      order: {
        favorite: 'DESC',
      },
      take: Number(payload?.length ?? 100),
      skip: Number(payload?.start ?? 0),
      relations: {
        doctor: true,
      },
    });

    const data = statements?.map((statement) => {
      const { createdAt, favorite, id, title, type, updatedAt, doctor } =
        statement;
      return {
        created_at: createdAt?.toDateString(),
        doctor_id: doctor?.id,
        doctor: {
          email: doctor?.email ?? '',
          firstname: doctor?.firstname ?? '',
          id: doctor?.id,
          lastname: doctor?.lastname ?? '',
        },
        favorite,
        id,
        title,
        type,
        updated_at: updatedAt?.toDateString(),
      };
    }) as DataRes[];

    const totalPage = Math.ceil(count / Number(payload?.length));
    const currentPage =
      Math.floor(Number(payload?.start) / Number(payload?.length)) + 1;
    return {
      draw: payload.draw.toString(),
      recordsTotal: count,
      recordsFiltered: count,
      data: data,
      totalPage,
      currentPage,
    };
  }
}
