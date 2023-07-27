import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodontalChartEntity } from 'src/entities/periodontal-chart.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';

@Injectable()
export class PeriodontalChartsService {
  constructor(
    @InjectRepository(PeriodontalChartEntity)
    private periodontalChartRepository: Repository<PeriodontalChartEntity>,
  ) {}

  //File php/periodontal-charts/index.php
  async index(patient_id: number) {
    try {
      const periodontalCharts = await this.periodontalChartRepository.find({
        where: { patientId: patient_id },
        relations: ['patient'],
      });
      const datas = periodontalCharts.map((data) => {
        return {
          id: data?.id,
          status: data?.status,
          create_date: data?.creationDate,
        };
      });
      return datas;
    } catch {
      return new CNotFoundRequestException('Patient Not Found');
    }
  }

  //File File php/periodontal-charts/show.php
  async show(id: number) {
    try {
      const data = await this.periodontalChartRepository.findOne({
        where: { id: id },
      });
      return data;
    } catch {
      return new CNotFoundRequestException('ID Not Found');
    }
  }
}
