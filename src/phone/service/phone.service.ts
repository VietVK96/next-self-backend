import { Injectable } from '@nestjs/common';
import { PhoneEntity } from 'src/entities/phone.entity';
import { DataSource } from 'typeorm';
@Injectable()
export class PhoneService {
  constructor(private dataSource: DataSource) {}
  async findAllBuPatient(patientId: number) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const select = `
  PHO.PHO_ID AS id,
  PHO.PHO_NBR AS number,
  PTY.PTY_ID AS phone_type_id,
  PTY.PTY_NAME AS phone_type_name
  `;
    // const phone = queryBuilder.select(select).from(PhoneEntity)
  }
}
