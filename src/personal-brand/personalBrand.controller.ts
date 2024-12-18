import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonalBrandService } from './service/personalBrand.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { UpdateInfoBodyDto } from './dtos/upload.dto';

@ApiTags('Personal brand')
@Controller('personal-brand')
@ApiBearerAuth()
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
          description: 'file pdf',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(TokenGuard)
  async uploadFile(
    @CurrentUser() userIdentity: UserIdentity,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UpdateInfoBodyDto,
  ) {
    return await this.personalBrandService.processCV(file, userIdentity, body);
  }

  @Post('recall')
  async recallExportAgent(
    @CurrentUser() identity: UserIdentity,
    @Body() userAnswers: string,
  ) {
    return await this.personalBrandService.processAnswers(
      userAnswers,
      identity,
    );
  }

  @Get('/')
  @UseGuards(TokenGuard)
  async getInfo(@CurrentUser() identity: UserIdentity) {
    return await this.personalBrandService.getUserInfo(identity);
  }

  @Post('/')
  @UseGuards(TokenGuard)
  async update(
    @CurrentUser() userIdentity: UserIdentity,
    @Body() body: UpdateInfoBodyDto,
  ) {
    return await this.personalBrandService.update(userIdentity, body);
  }

  @Get('/final-result')
  @UseGuards(TokenGuard)
  async getFinal(@CurrentUser() identity: UserIdentity) {
    return await this.personalBrandService.getFinal(identity);
  }

  @Get('/system-prompt')
  @UseGuards(TokenGuard)
  async getSystemPrompt() {
    return await this.personalBrandService.getSystemPrompt();
  }

  @Post('/system-prompt/:id')
  @UseGuards(TokenGuard)
  async updateSystemPrompt(
    @Param('id') id: number,
    @Body('content') content: string,
  ) {
    return await this.personalBrandService.updateSystemPrompt(id, content);
  }

  @Get('/system-prompt/check-cv')
  @UseGuards(TokenGuard)
  async checkCv(@CurrentUser() currentUser: UserIdentity) {
    return await this.personalBrandService.checkResultCV(currentUser);
  }
}
