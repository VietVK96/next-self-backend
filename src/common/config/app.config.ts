import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT || 3000,
  isSwagger: process.env.IS_SWAGGER || true,
  swaggerApi: process.env.SWAGGER_BASE_API || '/',
  host: process.env.HOST || 'http://localhost:3000',
  httpProxy: process.env.HTTP_PROXY || '',
  ovhApi: {
    applicationKey: process?.env?.OVH_APPLICATION_KEY ?? 'zGRjO5T1uEDsffzc8',
    applicationSecret:
      process?.env?.OVH_APPLICATION_SECRET ?? 'zv8gLFUzsdfSyp5lp31Ebgur2e72X0',
    consumerKey:
      process?.env?.OVH_CONSUMER_KEY ?? 'zAqkJJSsdfsbJHaadL2FY7CgIrFox0Y',
    serviceName: process?.env?.OVH_SERVICE_NAME ?? 'zms-hl35552-1',
  },
  apiKey: process.env.API_KEY,
  uploadDir: './uploads',
}));
