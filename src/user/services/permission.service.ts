import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PermissionService {
  constructor(private dataSource: DataSource) {}

  private _permissions = {
    PERMISSION_LIBRARY:
      'SELECT COUNT(*) FROM T_USER_USR WHERE(USR_PERMISSION_LIBRARY & ?) != 0 AND USR_ID = ? ',
    PERMISSION_PATIENT:
      'SELECT COUNT(*) FROM T_USER_USR WHERE(USR_PERMISSION_PATIENT & ?) != 0 AND USR_ID = ? ',
    PERMISSION_PASSWORD:
      'SELECT COUNT(*) FROM T_USER_USR WHERE(USR_PERMISSION_PASSWORD & ?) != 0 AND USR_ID = ? ',
    PERMISSION_DELETE:
      'SELECT COUNT(*) FROM T_USER_USR WHERE(USR_PERMISSION_DELETE & ?) != 0 AND USR_ID = ? ',
    PERMISSION_CALENDAR:
      'SELECT COUNT(*) FROM T_PRIVILEGE_PVG WHERE(PVG_PERMISSION_CALENDAR & ?) != 0 AND USR_ID = ? AND USR_WITH_ID = ? ',
    PERMISSION_BILLING:
      'SELECT COUNT(*) FROM T_PRIVILEGE_PVG WHERE(PVG_PERMISSION_BILLING & ?) != 0 AND USR_ID = ? AND USR_WITH_ID = ? ',
    PERMISSION_PAIEMENT:
      'SELECT COUNT(*) FROM T_PRIVILEGE_PVG WHERE(PVG_PERMISSION_PAIEMENT & ?) != 0 AND USR_ID = ? AND USR_WITH_ID = ? ',
    PERMISSION_ACCOUNTING:
      'SELECT COUNT(*) FROM T_PRIVILEGE_PVG WHERE(PVG_PERMISSION_ACCOUNTING & ?) != 0 AND USR_ID = ? AND USR_WITH_ID = ? ',
  };

  async hasPermission(
    name: string,
    valueRequired: number,
    userId: number,
    practitionerId: number = null,
  ) {
    if (!(name in this._permissions)) {
      return true;
    }
    const inputParameters = [valueRequired, userId];
    if (practitionerId !== null) {
      inputParameters.push(practitionerId);
    }
    try {
      const result = this.dataSource.manager.query(
        this._permissions[name],
        inputParameters,
      );
      const columnValue = result[0].column_name;
      return !!columnValue;
    } catch (error) {
      return false;
    }
  }
}
