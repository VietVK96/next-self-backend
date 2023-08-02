import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { macosPlatform, windowPlatform } from 'src/constants/image-software';
import { ImagingSoftwareEntity } from 'src/entities/imaging-software.entity';
import { WorkstationEntity } from 'src/entities/workstation.entity';
import { PlatformEnum } from 'src/enum/platform';
import { Repository } from 'typeorm';
import {
  CreateImageSoftwareDto,
  CreateImageSoftwareQueryDto,
} from '../dto/image-software.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class ImagingSoftwareService {
  constructor(
    @InjectRepository(WorkstationEntity)
    private workstaionRepository: Repository<WorkstationEntity>,
    @InjectRepository(ImagingSoftwareEntity)
    private imagingSoftwareRepository: Repository<ImagingSoftwareEntity>,
  ) {}

  async getImagingSoftwaresByWorkstationId(id: number) {
    try {
      if (!id) throw new CBadRequestException(ErrorCode.FORBIDDEN);
      const imagingSoftware = await this.imagingSoftwareRepository.find({
        where: { workstationId: id },
      });
      if (!imagingSoftware) throw new CBadRequestException(ErrorCode.NOT_FOUND);

      return imagingSoftware;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async getImagingSoftwaresTemplateOfWorkstationPlatform(
    query: CreateImageSoftwareQueryDto,
  ) {
    try {
      if (!query.workstationId)
        throw new CBadRequestException(ErrorCode.FORBIDDEN);
      const workstation = await this.workstaionRepository.findOne({
        where: {
          id: query.workstationId,
        },
      });
      let imagingSoftwares = [];
      if (workstation?.platform === PlatformEnum.WINDOWS) {
        imagingSoftwares = windowPlatform;
      } else if (workstation?.platform === PlatformEnum.MACOS) {
        imagingSoftwares = macosPlatform;
      }

      if (query.imaging_software) {
        let imagingSoftwares = [];
        if (workstation?.platform === PlatformEnum.WINDOWS) {
          imagingSoftwares = windowPlatform;
        } else if (workstation?.platform === PlatformEnum.MACOS) {
          imagingSoftwares = macosPlatform;
        }
        const lowerCaseQuery = query.imaging_software
          .toLowerCase()
          .replace(/[-\s]/g, '');
        const imagingSoftware = imagingSoftwares.find((software) =>
          lowerCaseQuery.includes(
            software.name?.replace(/[-\s]/g, '').toLowerCase(),
          ),
        );
        return imagingSoftware;
      } else {
        return imagingSoftwares;
      }
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async getImagingSoftwaresById(id: number, workstationId: number) {
    try {
      if (workstationId) throw new CBadRequestException(ErrorCode.FORBIDDEN);
      if (id) {
        const imagingSoftware = await this.imagingSoftwareRepository.findOne({
          where: { id },
        });
        return {
          id: imagingSoftware.id,
          name: imagingSoftware.name,
          executablePath: imagingSoftware.executablePath,
          configurationFilePath: imagingSoftware.configurationFilePath,
          imageDirname: imagingSoftware.imageDirname,
          imageBasenamePrefix: imagingSoftware.imageBasenamePrefix,
          imageBasenameLength: imagingSoftware.imageBasenameLength,
        };
      }
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
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

  async updateImagingSoftwaresByWorkstationId(
    id: number,
    workstationId: number,
    payload: CreateImageSoftwareDto,
  ) {
    try {
      if (!workstationId) {
        throw new CBadRequestException(ErrorCode.FORBIDDEN);
      }
      const currentImagingSoftware =
        await this.imagingSoftwareRepository.findOneOrFail({
          where: { id },
        });
      const imagingSoftware = new ImagingSoftwareEntity();
      imagingSoftware.name = payload?.name;
      imagingSoftware.executablePath = payload?.executablePath;
      imagingSoftware.configurationFilePath = payload?.configurationFilePath;
      imagingSoftware.imageDirname = payload?.imageDirname;
      imagingSoftware.imageBasenamePrefix = payload?.imageBasenamePrefix;
      imagingSoftware.imageBasenameLength = payload?.imageBasenameLength;
      imagingSoftware.computerName = payload?.computerName;

      return await this.imagingSoftwareRepository.save({
        ...currentImagingSoftware,
        ...imagingSoftware,
      });
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }

  async deleteImagingSoftwaresById(id: number) {
    try {
      const currentImagingSoftware =
        await this.imagingSoftwareRepository.findOneOrFail({
          where: { id },
        });
      await this.imagingSoftwareRepository.remove(currentImagingSoftware);
      return;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
