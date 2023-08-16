import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CertificatService } from './services/certificat.service';
import { CreateCertificatDto } from './dto/certificat.dto';

@ApiBearerAuth()
@ApiTags('Account')
@Controller('/account')
export class AccountController {
  constructor(private certificatService: CertificatService) {}

  @Get('/certificate')
  @UseGuards(TokenGuard)
  async getCertificate(@CurrentUser() identity: UserIdentity) {
    return this.certificatService.findCertificat(identity.id);
  }

  @Post('/certificate')
  @Header('Cache-Control', 'none')
  @UseGuards(TokenGuard)
  async createCertificat(
    @CurrentUser() identity: UserIdentity,
    @Body() body: CreateCertificatDto,
    @Request() request,
  ) {
    return this.certificatService.createCertificat(
      identity.id,
      identity.org,
      body,
      request,
    );
  }
}
