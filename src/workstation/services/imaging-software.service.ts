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
  ImageSoftwareDto,
} from '../dto/image-software.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';
import { checkEmpty } from 'src/common/util/string';
import { UserIdentity } from 'src/common/decorator/auth.decorator';
import { MACOS, WINDOWS } from './platformsClass';
import { parseString } from 'xml2js';
import { ShowImagingSoftwareQueryDto } from '../dto/show-imaging-softwar.dto';
import { CNotFoundRequestException } from 'src/common/exceptions/notfound-request.exception';
import { ContactEntity } from 'src/entities/contact.entity';
import { UserEntity } from 'src/entities/user.entity';
import { ImagingGatewayService } from './imaging-gateway.service';

@Injectable()
export class ImagingSoftwareService {
  constructor(
    @InjectRepository(WorkstationEntity)
    private workstaionRepository: Repository<WorkstationEntity>,
    @InjectRepository(ImagingSoftwareEntity)
    private imagingSoftwareRepository: Repository<ImagingSoftwareEntity>,
    @InjectRepository(ContactEntity)
    private contactRepo: Repository<ContactEntity>,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
    private imagingGatewayService: ImagingGatewayService,
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

  async getComputerNameFromPlatform(platform: number) {
    let incr = 0;
    let name: string;
    let workstation: WorkstationEntity;
    do {
      if (!Object.keys(PlatformEnum.choices).includes(platform.toString())) {
        throw new CBadRequestException(
          `Invalid value "${platform}" for ENUM type "PlatformEnum".`,
        );
      }
      name = PlatformEnum.choices[platform].concat(` ${++incr}`);
      workstation = await this.workstaionRepository.findOne({
        where: {
          platform,
          name,
        },
      });
    } while (workstation);
    return name;
  }

  async parseXML(xmlString: string) {
    let result: any;
    parseString(xmlString, (err, rs) => {
      if (err) {
        result = {};
      } else {
        result = rs?.document ? rs.document : rs;
      }
    });
    return result;
  }

  async imagingSoftware(
    req: Request,
    body: ImageSoftwareDto,
    identity: UserIdentity,
  ) {
    try {
      const parser = new UAParser(req.headers['user-agent']);
      const parserResults = parser.getResult();

      const platform =
        parserResults.os.name.toUpperCase() === 'WINDOWS'
          ? PlatformEnum.WINDOWS
          : PlatformEnum.MACOS;

      // On récupère le poste de travail ayant pour nom computerName
      // sinon on en créé un nouveau.
      let computerName = body?.computerName;
      if (checkEmpty(computerName)) {
        computerName = await this.getComputerNameFromPlatform(platform);
      }

      const workstation = new WorkstationEntity();
      workstation.organizationId = identity.org;
      if (typeof computerName === 'string') workstation.name = computerName;
      workstation.platform = platform;
      const workstationSaved = await this.workstaionRepository.save(
        workstation,
      );

      const xmlDoc = body?.radios ? await this.parseXML(body.radios) : {};
      for (const key in xmlDoc) {
        const parameters = xmlDoc[key];
        if (
          Object.keys(parameters).includes('Actif') &&
          parameters['Actif'].toString() !== '0'
        ) {
          continue;
        }

        const imagingSoftware = new ImagingSoftwareEntity();
        imagingSoftware.organizationId = identity.org;
        imagingSoftware.workstationId = workstationSaved.id;
        imagingSoftware.name = key.toUpperCase();

        if (PlatformEnum[platform] === 'WINDOWS') {
          if (typeof WINDOWS[imagingSoftware.name] !== 'function') continue;
          WINDOWS[imagingSoftware.name](imagingSoftware, parameters);
        } else {
          if (typeof MACOS[imagingSoftware.name] !== 'function') continue;
          MACOS[imagingSoftware.name](imagingSoftware, parameters);
        }
      }

      // @TODO
      //   $serializationContext = new SerializationContext();
      // $serializationContext->setGroups(['workstation:read']);

      // return JsonResponse::fromJsonString($container->get('jms_serializer')->serialize($workstation, 'json', $serializationContext))->send();

      return workstationSaved;
    } catch (e) {
      return new CBadRequestException(ErrorCode.FORBIDDEN);
    }
  }

  async showImagingSoftware(id: number, query: ShowImagingSoftwareQueryDto) {
    const imagingSoftware = await this.imagingSoftwareRepository.findOne({
      where: { id },
    });
    if (!imagingSoftware) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
    }

    const contact = await this.contactRepo.findOne({
      where: {
        id: query?.contactId,
      },
    });
    if (!contact) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
    }

    const practitioner = await this.userRepo.findOne({
      where: {
        id: query.practitionerId,
      },
    });
    if (!practitioner) {
      throw new CNotFoundRequestException(ErrorCode.NOT_FOUND);
    }

    return this.imagingGatewayService.getLaunchParameters(
      imagingSoftware,
      contact,
      practitioner,
    );
  }
}
