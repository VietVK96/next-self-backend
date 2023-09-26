import { registerAs } from '@nestjs/config';

export default registerAs('juxtalink', () => ({
  tokenServerUrl:
    process.env?.JUXTALINK_TOKEN_SERVER ??
    'https://dentalvia-drc-token-recette.juxta.cloud',
  updateServerUrl:
    process.env?.JUXTALINK_UPDATE_SERVER ??
    'https://dentalvia-drc-upd-recette.juxta.cloud',
  version: '2.0.0.0',
  drcDownloadPopup: 0,
  juxtalinkDownloadPopup: 1,
  plageDePorts: '1230-1240',
}));
