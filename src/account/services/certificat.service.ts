import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/services/user.service';
import { CertificateRes } from '../reponse/certificat.res';
@Injectable()
export class CertificatService {
  constructor(private userService: UserService) {}
  async findCertificat(id: number): Promise<CertificateRes> {
    const user = await this.userService.find(id);
    return {
      user: {
        id: user.id,
        log: user.login,
        admin: user.admin,
      },
      certificate: null,
    };
  }
}
