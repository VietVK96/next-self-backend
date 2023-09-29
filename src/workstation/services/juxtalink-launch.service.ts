import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JuxtalinkRes } from '../res/juxtalink.res';
import { constants } from 'crypto';
import * as https from 'https';

@Injectable()
export class JuxtalinkLaunchService {
  constructor(
    private http: HttpService,
    private configService: ConfigService,
  ) {}

  async callExecutable(
    executableDirname: string,
    executableBasename: string,
    executableParameters: string,
  ): Promise<JuxtalinkRes> {
    const token = await this.getToken();
    const version = this.configService.get<string>('juxtalink.version');
    const plageDePorts = this.configService.get<string>(
      'juxtalink.plageDePorts',
    );
    const drcDownloadPopup = this.configService.get<number>(
      'juxtalink.drcDownloadPopup',
    );
    const juxtalinkDownloadPopup = this.configService.get<number>(
      'juxtalink.juxtalinkDownloadPopup',
    );
    return {
      token,
      plugin: 'LaunchSoftware',
      action: 'CallExecutable',
      version: version,
      plageDePorts: plageDePorts,
      drcDownloadPopup: drcDownloadPopup,
      juxtalinkDownloadPopup: juxtalinkDownloadPopup,
      applicationUrl: this.getApplicationUrl(),
      parameters: {
        pathExeOds: executableDirname,
        nameExe: executableBasename,
        parametersExe: executableParameters,
      },
    };
  }

  async makeFileAndCallExe(
    configurationFileDirname: string,
    configurationFileBasename: string,
    configurationFileContents: string,
    executableDirname: string,
    executableBasename: string,
    executableParameters: string,
  ): Promise<JuxtalinkRes> {
    const token = await this.getToken();
    const version = this.configService.get<string>('juxtalink.version');
    const plageDePorts = this.configService.get<string>(
      'juxtalink.plageDePorts',
    );
    const drcDownloadPopup = this.configService.get<number>(
      'juxtalink.drcDownloadPopup',
    );
    const juxtalinkDownloadPopup = this.configService.get<number>(
      'juxtalink.juxtalinkDownloadPopup',
    );
    return {
      token,
      plugin: 'LaunchSoftware',
      action: 'CallExecutable',
      version: version,
      plageDePorts: plageDePorts,
      drcDownloadPopup: drcDownloadPopup,
      juxtalinkDownloadPopup: juxtalinkDownloadPopup,
      applicationUrl: this.getApplicationUrl(),
      parameters: {
        pathFileOds: configurationFileDirname,
        nameFile: configurationFileBasename,
        contenu: configurationFileContents,
        pathExeOds: executableDirname,
        nameExe: executableBasename,
        parametersExe: executableParameters,
      },
    };
  }

  async writeToClipboardAndCallExe(
    clipboardText: string,
    executableDirname: string,
    executableBasename: string,
    executableParameters: string,
  ): Promise<JuxtalinkRes> {
    const token = await this.getToken();
    const version = this.configService.get<string>('juxtalink.version');
    const plageDePorts = this.configService.get<string>(
      'juxtalink.plageDePorts',
    );
    const drcDownloadPopup = this.configService.get<number>(
      'juxtalink.drcDownloadPopup',
    );
    const juxtalinkDownloadPopup = this.configService.get<number>(
      'juxtalink.juxtalinkDownloadPopup',
    );
    return {
      token,
      plugin: 'LaunchSoftware',
      action: 'CallExecutable',
      version: version,
      plageDePorts: plageDePorts,
      drcDownloadPopup: drcDownloadPopup,
      juxtalinkDownloadPopup: juxtalinkDownloadPopup,
      applicationUrl: this.getApplicationUrl(),
      parameters: {
        clipboardText,
        pathExeOds: executableDirname,
        nameExe: executableBasename,
        parametersExe: executableParameters,
      },
    };
  }

  getApplicationUrl(): string {
    const updateUrl = this.configService.get<string>(
      'juxtalink.updateServerUrl',
    );
    return `${updateUrl}/getapplication.aspx?application=JuxtaLinkWinx86`;
  }

  async getToken() {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
    });
    const tokenUrl = this.configService.get<string>('juxtalink.tokenServerUrl');
    const { data } = await firstValueFrom(
      this.http.get(`${tokenUrl}/GetToken.aspx`, {
        httpsAgent,
        httpAgent: httpsAgent,
      }),
    );
    return data;
  }
}
