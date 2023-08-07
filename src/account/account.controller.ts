import {
  Controller,
  Get,
  Header,
  Post,
  Query,
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
@Controller('account')
export class AccountController {
  constructor(private certificatService: CertificatService) {}

  @Get('/certificate')
  @UseGuards(TokenGuard)
  async findImagingSoftwares(@CurrentUser() identity: UserIdentity) {
    return this.certificatService.findCertificat(identity.id);
  }

  @Post('/certificate')
  @Header('Cache-Control', 'none')
  @UseGuards(TokenGuard)
  async createCertificat(
    @CurrentUser() identity: UserIdentity,
    @Query() query: CreateCertificatDto,
    @Request() request,
  ) {
    return this.certificatService.createCertificat(
      identity.id,
      identity.org,
      query,
      request,
    );
  }
}
