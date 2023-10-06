import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PeriodontalChartEntity } from 'src/entities/periodontal-chart.entity';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ErrorCode } from 'src/constants/error';

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

  async delete(id: number) {
    try {
      await this.periodontalChartRepository.delete(id);
    } catch (err) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
    }
  }

  async update(payload, identity) {
    try {
      const matrix = JSON.stringify(payload?.matrix);
      return await this.periodontalChartRepository.save({
        id: payload?.id,
        userId: payload?.user_id,
        patientId: payload?.patient_id,
        creationDate: payload?.creation_date,
        status: payload?.status,
        probingDepth: payload?.probing_depth,
        gingivalMargin: payload?.gingival_margin,
        plaque: payload?.plaque,
        bleedingOnProbing: payload?.bleeding_on_probing,
        matrix: matrix,
        organizationId: identity?.org,
      } as PeriodontalChartEntity);
    } catch (err) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
    }
  }
}
