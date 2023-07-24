import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserIdentity } from 'src/common/decorator/auth.decorator';

@Injectable()
export class TokenDownloadService {
  constructor(private jwtService: JwtService) {}

  async createTokenDownload(identity: UserIdentity) {
    identity.type = 'download';
    return this.jwtService.sign(identity);
  }
}
