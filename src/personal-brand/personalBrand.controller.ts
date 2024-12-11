import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonalBrandService } from './service/personalBrand.service';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser, UserIdentity } from 'src/common/decorator/auth.decorator';

@ApiTags('Personal brand')
@Controller('personal-brand')
export class PersonalBrandController {
  constructor(private readonly personalBrandService: PersonalBrandService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'file CSV',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @CurrentUser() userIdentity: UserIdentity,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.personalBrandService.processCV(file, userIdentity.id);
    return {
      success: true,
    };
  }

  @Post('recall')
  async recallExportAgent(
    @CurrentUser() identity: UserIdentity,
    @Body() userAnswers: Record<string, any> ,
  ) {
    return await this.personalBrandService.processAnswers(userAnswers, identity);
  }
}
