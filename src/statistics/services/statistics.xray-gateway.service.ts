import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { checkEmpty } from 'src/common/util/string';
import { ErrorCode } from 'src/constants/error';
import { StatisticXrayGatewayEntity } from 'src/entities/statistic-xray-gateway.entity';
import { DataSource, Repository } from 'typeorm';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class StatisticsXrayGatewayService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(StatisticXrayGatewayEntity)
    private readonly statisticXrayGatewayEntity: Repository<StatisticXrayGatewayEntity>,
  ) {}

  async storeXrayGateways(identity: UserIdentity, req: Request, name: string) {
    try {
      if (checkEmpty(name))
        throw new CBadRequestException(ErrorCode.NAME_IS_REQUIRED);

      const parser = new UAParser(req.headers['user-agent']);
      const parserResults = parser.getResult();

      const operatingSystemName = parserResults.os.name;
      const operatingSystemVersion = parserResults.os.version;

      const statisticXrayGateway =
        await this.statisticXrayGatewayEntity.findOne({
          where: {
            groupId: identity.org,
            userId: identity.id,
            xrayName: name,
            operatingSystemName,
          },
        });

      if (statisticXrayGateway) {
        await this.statisticXrayGatewayEntity.update(
          {
            id: statisticXrayGateway.id,
          },
          {
            ...statisticXrayGateway,
            hits: statisticXrayGateway?.hits ? ++statisticXrayGateway.hits : 1,
          },
        );
      } else {
        const newStatisticXrayGateway: StatisticXrayGatewayEntity = {
          groupId: identity.org,
          userId: identity.id,
          xrayName: name,
          date: new Date().toISOString(),
          operatingSystemName,
          operatingSystemVersion,
        };
        await this.statisticXrayGatewayEntity.save(newStatisticXrayGateway);
      }
      return {
        success: true,
      };
    } catch (e) {
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }
}
