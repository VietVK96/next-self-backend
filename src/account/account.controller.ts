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
@Controller('/account')
export class AccountController {
  constructor(private certificatService: CertificatService) {}

  //settings/account/certificate.php
  //all line
  @Get('/certificate')
  @UseGuards(TokenGuard)
  async getCertificate(@CurrentUser() identity: UserIdentity) {
    return this.certificatService.findCertificat(identity.id);
  }

  //settings/account/certificate.php
  //all line
  //THIS FUNCTION WAS CONFIRM BY CLIENT IS NOT USING ANYMORE
  // @Post('/certificate')
  // @Header('Cache-Control', 'none')
  // @UseGuards(TokenGuard)
  // async createCertificat(
  //   @CurrentUser() identity: UserIdentity,
  //   @Body() body: CreateCertificatDto,
  //   @Request() request: ParameterDecorator,
  // ) {
  //   return this.certificatService.createCertificat(
  //     identity.id,
  //     identity.org,
  //     body,
  //     request,
  //   );
  // }
}
