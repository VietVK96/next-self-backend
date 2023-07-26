import {
  Controller,
  Delete,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SettingOrganizationService } from './services/setting-organization.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  TokenGuard,
  CurrentUser,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';

@ApiBearerAuth()
@Controller('settings/organizations')
@ApiTags('Settings/organization')
export class SettingOrganizationController {
  constructor(
    private settingOrganizationService: SettingOrganizationService,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'body upload document',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'file image/pdf',
        },
        contact: {
          type: 'number',
        },
      },
      required: ['file', 'contact'],
    },
  })
  @UseGuards(TokenGuard)
  async upload(@CurrentUser() user: UserIdentity, @Req() request: Request) {
    const files: Express.Multer.File = request['file'];
    const type: string = request.body['type'];
    const page: string = request.body['page'];

    return await this.settingOrganizationService.upload(
      user.org,
      page,
      files,
    );
  }

  @Delete('delete')
  @UseGuards(TokenGuard)
  async deletePatientPhoto(
    @CurrentUser() user: UserIdentity,
  ) {
    return await this.settingOrganizationService.deletePhoto(user);
  }
}
