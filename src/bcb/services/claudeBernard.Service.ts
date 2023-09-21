import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import * as Url from 'url';

//ecoophp/application/Service/MedicamentDatabase/ClaudeBernardService.php
@Injectable()
export class ClaudeBernardService {
  WSDL: string =
    'https://www.bcbdexther.fr/wsdl/BCBDexther-integrateurs-full.wsdl';
  tabConversion = [
    154, 43, 174, 241, 124, 205, 51, 103, 70, 40, 54, 93, 166, 130, 250, 217,
    24, 181, 3, 33, 210, 39, 125, 41, 10, 232, 62, 28, 207, 1, 255, 244, 63,
    160, 146, 191, 153, 100, 82, 76, 0, 155, 104, 56, 144, 228, 225, 45, 159,
    184, 248, 66, 69, 2, 17, 196, 15, 97, 211, 139, 246, 49, 129, 58, 5, 242,
    158, 86, 249, 112, 11, 101, 68, 148, 204, 219, 77, 170, 31, 133, 149, 81,
    71, 27, 235, 74, 171, 57, 238, 94, 132, 113, 222, 44, 243, 108, 227, 233,
    75, 188, 254, 165, 92, 35, 20, 114, 106, 34, 25, 152, 161, 29, 117, 179,
    192, 175, 221, 88, 7, 9, 138, 96, 4, 22, 236, 164, 214, 32, 212, 118, 6,
    229, 201, 8, 55, 42, 131, 231, 26, 230, 252, 48, 53, 151, 87, 50, 180, 197,
    91, 176, 239, 83, 16, 99, 19, 240, 127, 12, 172, 38, 203, 116, 173, 65, 47,
    200, 163, 234, 80, 135, 208, 140, 115, 18, 85, 226, 182, 169, 126, 245, 84,
    72, 168, 253, 78, 209, 147, 59, 136, 23, 220, 142, 218, 247, 185, 98, 13,
    52, 206, 198, 150, 102, 79, 105, 187, 237, 186, 119, 36, 90, 107, 162, 109,
    137, 30, 122, 194, 216, 223, 128, 195, 251, 21, 111, 190, 67, 224, 121, 120,
    143, 157, 73, 177, 199, 141, 95, 213, 202, 46, 134, 61, 215, 89, 156, 178,
    123, 37, 64, 110, 14, 183, 145, 193, 189, 60, 167,
  ];
  #codeEditeur: string = '';
  #idPS: string = '';
  client: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.#codeEditeur = configService.get<string>(
      'app.claudeBernard.codeEditeur',
    );
    const proxy = configService.get<string>('app.httpProxy') || '';
    // Create an Axios instance with the proxy settings
    const url = Url.parse(proxy);
    this.client = axios.create({
      baseURL: this.WSDL,
      proxy: {
        host: url.host,
        port: +url.port || null,
      },
    });
  }

  setIdPS(idPS: string) {
    this.#idPS = idPS;
  }

  call(params: { query: string; type: number; baseLocation: number }) {
    return this.client.request({
      params: {
        codeEditeur: this.#codeEditeur,
        idPS: this.#idPS,
        secretEditeur: this.generateKey(),
        ...params,
      },
    });
  }

  /**
   * Retourne le code de sécurité utilisé pour l'authentification
   * au service web.
   *
   * @return string
   */
  generateKey(): string {
    let codeSecurite = '';
    const curYear = dayjs().year();
    const curMonth = dayjs().month() + 1;
    const curDay = dayjs().date();
    const chaineACoder =
      curMonth + this.#codeEditeur + this.#idPS + curYear + curDay;
    let chaineCodee = '';
    for (let i = 0; i < chaineACoder.length; i++) {
      chaineCodee += this.tabConversion[chaineACoder.codePointAt(i)];
    }
    for (let i = 2; i < chaineCodee.length; i += 3) {
      codeSecurite += chaineCodee[i];
    }
    return codeSecurite;
  }
}
