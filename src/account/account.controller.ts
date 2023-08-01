import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CertificatService } from './services/certificat.service';

@ApiBearerAuth()
@ApiTags('Account')
@Controller('account')
export class AccountController {
  constructor(private certificatService: CertificatService) {}

  @Get('/certificate')
  @UseGuards(TokenGuard)
  async findImagingSoftwares(@CurrentUser() identity: UserIdentity) {
    return this.certificatService.findCertificat(identity.id);
  }
}
