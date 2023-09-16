import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT || 3000,
  isSwagger: process.env.IS_SWAGGER || true,
  swaggerApi: process.env.SWAGGER_BASE_API || '/',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  urlImg: process.env.IMAGE_URL || 'http://localhost:3000',
  host: process.env.HOST || 'http://localhost:3000',
  sesamVitale: {
    cnda: process.env.SESAM_VITALE_CNDA || false,
    endPoint:
      process.env.SESAM_VITALE_END_POINT ||
      'https://dentalvia-fsv-recette.juxta.cloud',
    host: process.env.SESAM_VITALE_HOST || 'localhost',
    port: process.env.SESAM_VITALE_PORT || 1234,
  },
  wzagenda: {
    wsdl:
      process?.env?.WZAGENDA_WSDL_END_POINT ||
      `https://secure.wz-agenda.net/webservices/3.1/server.php?wsdl`,
    namespace:
      process?.env?.WZAGENDA_END_POINT ||
      `https://secure.wz-agenda.net/webservices/3.1/server.php#wzcalendar`,
  },
  haliteKey: process?.env?.HALITE_KEY || '', // DATABASE_ENCRYPTION_KEY in php,
  monetico: {
    companyCode: process?.env?.MONETICO_COMPANY_CODE || `ECOODENTIST`,
    eptCode: process?.env?.MONETICO_EPT_CODE || `6290886`,
    securityCode:
      process?.env?.MONETICO_SECURITY_KEY ||
      `FF23C97BA6B760A6E3BBE298DA18415334558D92`,
  },
  claudeBernard: {
    wdsl:
      process?.env?.CLAUDE_BERNARD_END_POINT ||
      'https://www.bcbdexther.fr/wsdl/BCBDexther-integrateurs-full.wsdl',
    codeEditeur: process?.env?.CLAUDE_BERNARD_CODE_EDITEUR || 'ECOODENTIST',
  },
  mail: {
    folderTemplate:
      process?.env?.MAIL_FOLDER_TEMPLATE || process.cwd() + '/templates/',
  },
  folderFrontend: process.env?.FRONTEND_FOLDER ?? '',
  countries: {
    url: process?.env?.COUNTRIES_URL ?? 'https://restcountries.com/v3.1/all',
  },
  googleCalendar: {
    clientId:
      process?.env?.GOOGLE_CLIENT_ID ??
      '770111839875-2htniqvi3g7r3jnm8abni1pe00r04kis.apps.googleusercontent.com',
    clientSecret:
      process?.env?.GOOGLE_CLIENT_SECRET ??
      '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',
    clientSide: process?.env?.CLIENT_SIDE ?? 'https://test.ecoodentist.com',
  },
  ovhApi: {
    applicationKey: process?.env?.OVH_APPLICATION_KEY ?? 'zGRjO5T1uEDsffzc8',
    applicationSecret:
      process?.env?.OVH_APPLICATION_SECRET ?? 'zv8gLFUzsdfSyp5lp31Ebgur2e72X0',
    consumerKey:
      process?.env?.OVH_CONSUMER_KEY ?? 'zAqkJJSsdfsbJHaadL2FY7CgIrFox0Y',
    serviceName: process?.env?.OVH_SERVICE_NAME ?? 'zms-hl35552-1',
  },
}));
