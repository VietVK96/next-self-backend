import { Injectable } from '@nestjs/common';
import { AddressEntity } from 'src/entities/address.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import { OrderContextBilling } from './monetico/orderContextBilling';
import { OrderContextClient } from './monetico/orderContextClient';
import { OrderContext } from './monetico/orderContext';
import { StringHelper } from 'src/common/util/string-helper';
import { PaymentRequest } from './monetico/paymentRequest';
import { Monetico } from './monetico/monetico';
import { Request } from 'express';
import { FindNotificationRes } from './response/find.notification.setting.res';
import { FindMessageNotificationRes } from './response/findMessage.notification.res';
import { DEFAULT_MESSAGE } from 'src/constants/default';
import { SaveMessageNotificationDto } from './dto/saveMessage.notification.dto';
import { ReminderTypeEntity } from 'src/entities/reminder-type.entity';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { ErrorCode } from 'src/constants/error';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { SaveSmsShareDto } from './dto/notification.dto';
import { SuccessResponse } from 'src/common/response/success.res';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationSettingService {
  constructor(private dataSource: DataSource, private config: ConfigService) {}

  //application/Entities/Address.php
  //application/Entities/AddressEntity.php

  _hasAllFieldsRequiredForBilling(address: AddressEntity): boolean {
    return (
      !!address?.street &&
      !!address?.city &&
      !!address?.zipCode &&
      !!address?.countryAbbr
    );
  }

  async getSmsQuantity(userId: number) {
    const smsCount: { sumSms: number }[] = await this.dataSource.query(
      `
      SELECT SUM(
          CASE WHEN T_GROUP_GRP.GRP_SHARE_SMS = 1
          THEN T_USER_SMS_USS.USS_STOCK
          ELSE (
              CASE WHEN user.USR_ID = ?
              THEN T_USER_SMS_USS.USS_STOCK
              ELSE 0
              END
          )
          END
      ) as sumSms
      FROM T_USER_USR user
      JOIN T_GROUP_GRP on user.organization_id = T_GROUP_GRP.GRP_ID
      JOIN T_USER_SMS_USS on user.USR_ID = T_USER_SMS_USS.USR_ID`,
      [userId],
    );
    return smsCount;
  }

  async find(
    userId: number,
    request: Request,
    host: string,
  ): Promise<FindNotificationRes> {
    const url = `${request.protocol}://${host}${request.originalUrl}`;
    if (!userId) throw new CBadRequestException(ErrorCode.FORBIDDEN);
    const user = await this.dataSource.getRepository(UserEntity).findOne({
      where: { id: userId },
      relations: {
        address: true,
        group: {
          address: true,
        },
      },
    });
    if (!user) throw new CBadRequestException(ErrorCode.NOT_FOUND_USER);
    const products = [];
    const addressOfUser: AddressEntity = user?.address;
    const addressOfOrganization: AddressEntity = user?.group?.address;
    let address: AddressEntity;
    if (addressOfUser && this._hasAllFieldsRequiredForBilling(addressOfUser)) {
      address = addressOfUser;
    } else if (
      addressOfOrganization &&
      this._hasAllFieldsRequiredForBilling(addressOfOrganization)
    ) {
      address = addressOfOrganization;
    }

    const billing = new OrderContextBilling(
      address?.street,
      address?.city,
      address?.zipCode,
      address?.countryAbbr,
    );
    billing.setFirstName(user?.firstname);
    billing.setLastName(user?.lastname);
    billing.setEmail(user?.email);

    const client = new OrderContextClient();
    client.setFirstName(user?.firstname);
    client.setLastName(user?.lastname);
    client.setEmail(user?.email);

    const context = new OrderContext(billing);
    context.setOrderContextClient(client);
    const reference = StringHelper.random('alnum', 12).toUpperCase();

    const pack100smsPaymentRequest = new PaymentRequest(
      reference,
      19.0,
      'EUR',
      'FR',
      context,
    );
    pack100smsPaymentRequest.setMail(user?.email);
    pack100smsPaymentRequest.setUrlRetourOk(url);
    pack100smsPaymentRequest.setUrlRetourErreur(url);
    pack100smsPaymentRequest.setTexteLibre(
      JSON.stringify({
        id: user?.id,
        lastName: user?.lastname,
        firstName: user?.faxNumber,
        product: 'PACK100SMS',
      }),
    );

    const pack500smsPaymentRequest = new PaymentRequest(
      reference,
      69.0,
      'EUR',
      'FR',
      context,
      user?.email,
      url,
      url,
    );
    pack500smsPaymentRequest.setTexteLibre(
      JSON.stringify({
        id: user?.id,
        lastName: user?.lastname,
        firstName: user?.faxNumber,
        product: 'PACK500SMS',
      }),
    );

    const pack1000smsPaymentRequest = new PaymentRequest(
      reference,
      120.0,
      'EUR',
      'FR',
      context,
      user?.email,
      url,
      url,
    );
    pack1000smsPaymentRequest.setTexteLibre(
      JSON.stringify({
        id: user.id,
        lastName: user.lastname,
        firstName: user.faxNumber,
        product: 'PACK1000SMS',
      }),
    );

    const monetico = new Monetico(
      this.config.get<string>('app.monetico.companyCode'),
      this.config.get<string>('app.monetico.eptCode'),
      this.config.get<string>('app.monetico.securityCode'),
    );

    products.push({
      pack100sms: monetico.getFormFields(pack100smsPaymentRequest),
    });
    products.push({
      pack500sms: monetico.getFormFields(pack500smsPaymentRequest),
    });
    products.push({
      pack1000sms: monetico.getFormFields(pack1000smsPaymentRequest),
    });

    const smsCount: { sumSms: number }[] = await this.getSmsQuantity(userId);
    const respone = {
      user: {
        admin: user?.admin,
        group: { smsShared: user?.group?.smsSharing },
      },
      smsQuantity: smsCount[0].sumSms,
      products: products,
      address: {
        allFieldsRequiredForBilling:
          this._hasAllFieldsRequiredForBilling(address),
      },
    };
    return respone;
  }

  async findMessage(userId: number): Promise<FindMessageNotificationRes> {
    const statement = await this.dataSource.query(
      `
    SELECT
    T_REMINDER_MESSAGE_RMM.RMM_ID AS id,
    T_REMINDER_MESSAGE_RMM.RMM_MSG AS body,
    T_REMINDER_TYPE_RMT.RMT_ID AS reminder_type_id,
    T_REMINDER_TYPE_RMT.RMT_NAME AS reminder_type_name
FROM T_REMINDER_MESSAGE_RMM
JOIN T_REMINDER_TYPE_RMT
WHERE T_REMINDER_MESSAGE_RMM.USR_ID = ?
  AND T_REMINDER_MESSAGE_RMM.RMT_ID = T_REMINDER_TYPE_RMT.RMT_ID`,
      [userId],
    );

    const messages = {};
    for (const message of statement) {
      messages[message['reminder_type_name']] = message['body'];
    }
    return {
      messages,
      defaultMessage: DEFAULT_MESSAGE,
    };
  }

  async saveMessage(userId: number, payload: SaveMessageNotificationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (Object.keys(payload).length > 0) {
        const promises = [];
        for (const name in payload) {
          promises.push(
            queryRunner.manager
              .getRepository(ReminderTypeEntity)
              .findOne({ where: { name: name } }),
          );
        }
        const reminderTypes: ReminderTypeEntity[] = await Promise.all(promises);
        if (Object.keys(reminderTypes).length > 0) {
          const promises2 = [];
          for (const reminderType of reminderTypes) {
            if (!payload[reminderType.name]) {
              promises2.push(
                queryRunner.query(
                  ` DELETE FROM T_REMINDER_MESSAGE_RMM
              WHERE USR_ID = ?
                AND RMT_ID = ?`,
                  [userId, reminderType.id],
                ),
              );
            } else {
              promises2.push(
                queryRunner.query(
                  ` INSERT INTO T_REMINDER_MESSAGE_RMM (USR_ID, RMT_ID, RMM_MSG)
              VALUES (?, ?, ?)
              ON DUPLICATE KEY
              UPDATE
              RMM_MSG = VALUES(RMM_MSG)`,
                  [userId, reminderType.id, payload[reminderType.name]],
                ),
              );
            }
          }
          await Promise.all(promises2);
        }
      }
      await queryRunner.commitTransaction();
      return {
        success: true,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      return new CBadRequestException(ErrorCode.SAVE_FAILED);
    } finally {
      await queryRunner.release();
    }
  }

  async saveSmsShare(
    organizationId: number,
    payload: SaveSmsShareDto,
  ): Promise<SuccessResponse> {
    try {
      if (!organizationId) throw new CBadRequestException(ErrorCode.FORBIDDEN);
      const organization = await this.dataSource
        .getRepository(OrganizationEntity)
        .findOne({ where: { id: organizationId } });
      if (!organization) throw new CBadRequestException(ErrorCode.NOT_FOUND);
      organization.smsSharing = payload?.smsShared;
      await this.dataSource
        .getRepository(OrganizationEntity)
        .save(organization);
      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
