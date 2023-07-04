import {
  UserUserPreferenceRes,
  UserUserSettingRes,
} from 'src/auth/reponse/session.res';

export class SaveEventPayloadDto extends UserUserPreferenceRes {
  settings?: UserUserSettingRes;
}
