import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { MysqlConnectionCredentialsOptions } from 'typeorm/driver/mysql/MysqlConnectionCredentialsOptions';

export default registerAs('database', (): TypeOrmModuleOptions => {


  const slaves: MysqlConnectionCredentialsOptions[] = [];

  const slaveHosts = `${process.env.DATABASE_SLAVES_HOST || ''}`.split(',');
  const slavePorts = `${process.env.DATABASE_SLAVES_PORT || ''}`.split(',');
  const slaveUsernames = `${process.env.DATABASE_SLAVES_USERNAME || ''}`.split(',');
  const slavePasswords = `${process.env.DATABASE_SLAVES_PASSWORD || ''}`.split(',');
  const slaveDbs = `${process.env.DATABASE_SLAVES_NAME || ''}`.split(',');

  let i = 0;
  for (const host of slaveHosts) {
    slaves.push({
      host,
      port: parseInt(slavePorts[i]),
      username: slaveUsernames[i],
      password: slavePasswords[i],
      database: slaveDbs[i],
    });
    i++;
  }
  return {
    type: 'mysql',
    replication: {
      master: {
        host: process.env.DATABASE_HOST || '127.0.0.1',
        port: parseInt(`${process.env.DATABASE_PORT || 33063}`),
        username: process.env.DATABASE_USERNAME || 'root',
        password: process.env.DATABASE_PASSWROD || 'test',
        database: process.env.DATABASE_NAME || 'dental',
      },
      slaves,
    },
    // synchronize: process.env.NODE_ENV !== 'production',
    synchronize: false,
    logging: process.env.DATABASE_LOGGING !== 'false' ? true : ['error'],
    autoLoadEntities: true,
    entities: [join(__dirname, '**/**.entity{.ts,.js}')],
}});
