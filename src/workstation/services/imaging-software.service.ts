import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { macosPlatform, windowPlatform } from 'src/constants/image-software';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { PlatformEnum } from 'src/enum/platform';
import { DataSource, Repository } from 'typeorm';
import {
  CreateImageSoftwareDto,
  CreateImageSoftwareQueryDto,
} from '../dto/image-software.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class ImagingSoftwareService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(WorkstationEntity)
    private workstaionRepository: Repository<WorkstationEntity>,
    @InjectRepository(ImagingSoftwareEntity)
    private imagingSoftwareRepository: Repository<ImagingSoftwareEntity>,
  ) {}

  async getImagingSoftwaresByWorkstation(workstationId: number) {
    if (!workstationId) throw new CBadRequestException(ErrorCode.FORBIDDEN);
    const workstation = await this.workstaionRepository.findOne({
      where: {
        id: workstationId,
      },
    });
    let imagingSoftwares = [];
    if (workstation?.platform === PlatformEnum.WINDOWS) {
      imagingSoftwares = windowPlatform;
    } else if (workstation?.platform === PlatformEnum.MACOS) {
      imagingSoftwares = macosPlatform;
    }

    return imagingSoftwares;
  }

  async createImagingSoftwaresByWorkstationId(
    organizationId: number,
    query: CreateImageSoftwareQueryDto,
    body: CreateImageSoftwareDto,
  ) {
    try {
      if (
        !query?.workstationId ||
        !organizationId ||
        !query?.imaging_software
      ) {
        throw new CBadRequestException(ErrorCode.FORBIDDEN);
      }

      const imagingSoftware = new ImagingSoftwareEntity();
      imagingSoftware.organizationId = organizationId;
      imagingSoftware.workstationId = query?.workstationId;
      imagingSoftware.originalName = query?.imaging_software;
      imagingSoftware.name = body?.name;
      imagingSoftware.executablePath = body?.executablePath;
      imagingSoftware.configurationFilePath = body?.configurationFilePath;
      imagingSoftware.imageDirname = body?.imageDirname;
      imagingSoftware.imageBasenamePrefix = body?.imageBasenamePrefix;
      imagingSoftware.imageBasenameLength = body?.imageBasenameLength;
      imagingSoftware.computerName = body?.computerName;

      return await this.imagingSoftwareRepository.save(imagingSoftware);
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async findOneImagingSoftwaresByWorkstationId(id: number) {
    try {
      if (!id) throw new CBadRequestException(ErrorCode.FORBIDDEN);
      const imagingSoftware = await this.imagingSoftwareRepository.findOne({
        where: { id },
      });
      if (!imagingSoftware) throw new CBadRequestException(ErrorCode.NOT_FOUND);

      return imagingSoftware;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
