import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonalBrandService } from './service/personalBrand.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Personal brand')
@Controller('personal-brand')
export class PersonalBrandController {
  constructor(private readonly personalBrandService: PersonalBrandService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const cvSummary = await this.personalBrandService.processCV(file);
    return { summary: cvSummary };
  }
}
