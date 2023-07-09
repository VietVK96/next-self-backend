import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TrashEventService {
  constructor(private readonly dataSource: DataSource) {}
}
