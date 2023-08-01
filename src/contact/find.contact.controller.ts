import {
  Controller,
  Get,
  Logger,
  Param,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CurrentDoctor } from 'src/common/decorator/doctor.decorator';
import { FindAllContactDto } from './dto/findAll.contact.dto';
import { ContactService } from './services/contact.service';
import { FindContactService } from './services/find.contact.service';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { TokenDownloadGuard } from 'src/common/decorator/token-download.decorator';
@ApiBearerAuth()
@Controller('/contact')
@ApiTags('Contact')
export class FindContactController {
  private logger: Logger = new Logger(FindContactController.name);
  constructor(
    private findContactService: FindContactService,
    private contactService: ContactService,
  ) {}

  // File php/contact/findAll.php 1->8
  @Get()
  @ApiQuery({
    name: 'conditions',
    type: FindAllContactDto,
  })
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  @UseGuards(TokenGuard)
  async findAll(
    @Query() request: FindAllContactDto,
    @CurrentDoctor() doctorId: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.findContactService.findAll(request, doctorId, identity.org);
  }

  @Get('find/:id')
  @ApiQuery({
    name: 'conditions',
    type: FindAllContactDto,
  })
  @ApiHeader({
    name: 'X-DoctorId',
    description: 'DoctorId',
  })
  @UseGuards(TokenGuard)
  async findOne(
    @CurrentDoctor() doctorId: number,
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.contactService.findOne(id, doctorId, identity);
  }

  // File php/contact/recentlyTreated/findAll.php 1->8
  @Get('/recentlyTreated')
  @UseGuards(TokenGuard)
  async findAllRecentlyTreated(@Query('practitioner') practitioner?: number) {
    return this.findContactService.findAllRecentlyTreated(practitioner);
  }

  // File php/contact/next.php
  @Get('/next')
  @UseGuards(TokenGuard)
  async getNextContact(
    @CurrentUser() identity: UserIdentity,
    @Query('practitioner') practitioner?: number,
    @Query('contact') contact?: number,
  ) {
    return this.contactService.getNextContact(contact, practitioner, identity);
  }

  // File php/contact/previous.php
  @Get('/previous')
  @UseGuards(TokenGuard)
  async getPreviousContact(
    @Query('practitioner') practitioner?: number,
    @Query('contact') contact?: number,
  ) {
    return this.contactService.getPreviousContact(contact, practitioner);
  }

  @Get('retrieve/:id')
  @UseGuards(TokenGuard)
  async getPatientInfoAgenda(
    @Param('id') id: number,
    @CurrentUser() identity: UserIdentity,
  ) {
    return this.findContactService.getPatientInfoAgenda(
      id,
      identity.id,
      identity.org,
    );
  }

  // File : php/contact/avatar.php 100%
  @Get('avatar/:contactId')
  @UseGuards(TokenDownloadGuard)
  async getAvatar(
    @Param('contactId') contactId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const fileRes = await this.contactService.getAvatar(contactId);
      if (!fileRes || !existsSync(fileRes?.file)) {
        res.set({
          'Content-Type': 'image/jpeg',
        });
        return new StreamableFile(
          createReadStream(
            join(process.cwd(), 'resources/front', 'no_image.png'),
          ),
        );
      }
      const file = createReadStream(fileRes?.file);
      file.on('error', (_e) => {
        res.set({
          'Content-Type': 'image/jpeg',
        });
        createReadStream(
          join(process.cwd(), 'resources/front', 'no_image.png'),
        ).pipe(res);
        return;
      });
      res.set({
        'Content-Type': 'image/jpeg',
      });
      return new StreamableFile(file);
    } catch (e) {
      this.logger.error(e);
    }
  }
}
