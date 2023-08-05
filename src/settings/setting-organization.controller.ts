import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { SettingOrganizationService } from './services/setting-organization.service';
import { UpdateOrganizationDto } from './dtos/setting-organization.dto';
import { Request } from 'express';

@ApiBearerAuth()
@Controller('settings/organizations')
@ApiTags('Settings/organization')
export class SettingOrganizationController {
  constructor(private settingOrganizationService: SettingOrganizationService) {}

  @Post('/update')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
          description: 'file image/pdf',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo'))
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() identity: UserIdentity,
    @UploadedFile() logo,
    @Body() body: UpdateOrganizationDto,
  ) {
    return await this.settingOrganizationService.update(
      identity.org,
      identity.id,
      body,
      logo,
    );
  }

  @Delete('delete')
  @UseGuards(TokenGuard)
  async deletePatientPhoto(@CurrentUser() user: UserIdentity) {
    return await this.settingOrganizationService.deletePhoto(user);
  }
}
