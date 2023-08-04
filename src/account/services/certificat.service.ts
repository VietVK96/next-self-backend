import { Injectable } from '@nestjs/common';
import { CertificateRes } from '../reponse/certificat.res';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateCertificatDto } from '../dto/certificat.dto';
@Injectable()
export class CertificatService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private dataSource: DataSource,
  ) {}

  async ids_CertRequest(
    clientCookie,
    request,
    Identifier,
    Comment = '',
    OrganizationUnit = 'ngp',
    owner = 'PROMPT',
    Privilege = 255,
    Profile = 0,
    Duration = 1095,
    AuthenticationMask = 16,
    Number = 100,
  ) {
    const application = process.env.IDS_APPLICATION;
    const cookieName = 'sessionids';
    const cookie = clientCookie[cookieName] ?? null;

    const CertRequest = {
      Application: application,
      Requester: request.headers.HTTP_IDS_USER,
      AuthCookie: cookie,
      OrganizationUnit: OrganizationUnit,
      Owner: owner,
      Identifier: Identifier,
      Privilege: Privilege,
      Profile: Profile,
      Duration: Duration,
      AuthenticationMask: AuthenticationMask,
      Number: Number,
      Comment: Comment,
    };

    return this.getWSResponse(CertRequest);
  }

  getWSResponse(object, functionVariable = '') {
    if (
      functionVariable === '' &&
      Object.keys({ object })[0] === 'CertRequest'
    ) {
      functionVariable = 'CertRequest';
    } else {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }
    let wsdlAdress;
    if (functionVariable === 'CertRequest') {
      wsdlAdress = 'pki';
    } else {
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    }

    // @TODO call to soap
    throw new CBadRequestException(ErrorCode.FORBIDDEN);

    // try {

    //   const wsdl = `http://api.idshost.priv/${wsdlAdress}.wsdl`

    //   $service = new SoapClient($wsdl, [
    //     'compression' => true,
    //     'trace' => true
    //   ]);

    //   const reponse = service.

    //   $response = $service -> { functionVariable }($object);
    //   return $response;

    // } catch (SoapFault $fault) {

    //   Registry:: get('monolog.main') -> withName('ids') -> error($fault);

    //   throw $fault;

    // }
  }

  async findCertificat(userId: number): Promise<CertificateRes> {
    if (!userId) throw new CBadRequestException(ErrorCode.FORBIDDEN);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return {
      user: {
        id: user.id,
        log: user.log,
        admin: user.admin,
      },
      certificate: null,
    };
  }

  async createCertificat(
    userId: number,
    organizationId: number,
    query: CreateCertificatDto,
    request,
  ) {
    if (!userId || !organizationId)
      throw new CBadRequestException(ErrorCode.FORBIDDEN);
    const userEntity = await this.userRepo.findOne({ where: { id: userId } });
    if (!userEntity) throw new CBadRequestException(ErrorCode.NOT_FOUND);
    const identifiant = userEntity?.log;
    const groupTime = organizationId.toString() + '-' + Date.now().toString();
    try {
      const certificat = await this.ids_CertRequest(
        JSON.parse(query.cookie),
        request,
        identifiant,
        groupTime,
      );
      return certificat;
    } catch (error) {
      throw new CBadRequestException(error?.message);
    }
  }
}
