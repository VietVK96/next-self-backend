import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as ovh from 'ovh';
import { UserEntity } from 'src/entities/user.entity';
import {
  PhoneNumber,
  PhoneNumberFormat,
  PhoneNumberUtil,
} from 'google-libphonenumber';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { UserService } from 'src/user/services/user.service';
import { CONFIGURATION } from 'src/constants/configuration';
import { SendSmsResponse } from '../response/sendSms.response';
import { InjectRepository } from '@nestjs/typeorm';
import { UserSmsEntity } from 'src/entities/user-sms.entity';
import { SendingLogEntity } from 'src/entities/sending-log.entity';
import * as dayjs from 'dayjs';
import { ErrorCode } from 'src/constants/error';

/**
 * application/Service/Notifier/Texter.php
 */
@Injectable()
export class TexterService {
  private user: UserEntity;
  private sender: string;
  private receivers: string[];
  private ovhClient;
  private serviceName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SendingLogEntity)
    private readonly sendingLogRepo: Repository<SendingLogEntity>,
    @InjectRepository(UserSmsEntity)
    private readonly userSmsRepo: Repository<UserSmsEntity>,
  ) {
    this.sender = CONFIGURATION.ovh.sender;
    this.receivers = [];
    this.ovhClient = new ovh({
      endpoint: CONFIGURATION.ovh.endpoint,
      appKey: this.configService.get('app.ovhApi.applicationKey'),
      appSecret: this.configService.get('app.ovhApi.applicationSecret'),
      consumerKey: this.configService.get('app.ovhApi.consumerKey'),
      serviceName: this.configService.get('app.ovhApi.serviceName'),
    });
    this.serviceName = this.configService.get('app.ovhApi.serviceName');
  }

  public init() {
    this.sender = CONFIGURATION.ovh.sender;
    this.receivers = [];
    this.ovhClient = new ovh({
      endpoint: CONFIGURATION.ovh.endpoint,
      appKey: this.configService.get('app.ovhApi.applicationKey'),
      appSecret: this.configService.get('app.ovhApi.applicationSecret'),
      consumerKey: this.configService.get('app.ovhApi.consumerKey'),
      serviceName: this.configService.get('app.ovhApi.serviceName'),
    });
    this.serviceName = this.configService.get('app.ovhApi.serviceName');
  }

  public setUser(user: UserEntity) {
    this.user = user;
  }

  public setSender(sender: string) {
    this.sender = sender;
  }

  /**
   * @param string $number
   * @param string $countryCode
   * @return $this
   */
  public addReceiver(number: string, countryCode = 'FR') {
    this.receivers.push(
      this.nationalToInternationalPhoneNumber(number, countryCode),
    );
  }

  /**
   * Envoi un message a un ou plusieurs destinataires.
   *
   * @throws \LengthException
   *
   * @param string $message
   * @param array $options
   */
  public async send(message: string, options = {}) {
    try {
      // Vérification du stock de SMS de l'utilisateur
      if (this.user instanceof UserEntity) {
        await this.assertSmsQuantity(message);
      }

      const response: SendSmsResponse = await this.ovhClient.requestPromised(
        'POST',
        `/sms/${this.serviceName}/jobs`,
        {
          charset: 'UTF-8',
          class: 'phoneDisplay',
          coding: '7bit',
          message: message,
          priority: 'medium',
          receivers: this.receivers,
          sender: this.sender,
          senderForResponse: false,
          noStopClause: true,
          ...options,
        },
      );

      // Modifie le stock de SMS de l'utilisateur
      if (this.user instanceof UserEntity) {
        await this.updateSmsQuantity(response, message);
      }

      return response;
    } catch (error) {
      throw new CBadRequestException(error?.response?.msg || error?.sqlMessage);
    }
  }

  /**
   * Retourne les informations du sms.
   *
   * @param int $id
   * @return array
   */
  public async getSms(id: number) {
    try {
      return await this.ovhClient.requestPromised(
        'get',
        `/sms/${this.serviceName}/outgoing/${id}`,
      );
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Vérifie que la quantité de sms de l'utilisateur est supérieure à 0.
   *
   * @throws \OutOfBoundsException
   * @param string $message
   */
  private async assertSmsQuantity(message: string) {
    const smsQuantity = await this.userService.getSmsQuantity(this.user.id);
    const smsCount = Math.ceil(
      message.length / CONFIGURATION.setting.MAX_SMS_CHARACTERS,
    );

    if (0 === Math.max(0, (smsQuantity.smsQuantity ?? 0) - smsCount)) {
      throw new CBadRequestException('VALIDATION_MIN_NUMERIC', {
        attribute: 'sms',
        min: 1,
      });
    }
  }

  /**
   * Modifie la quantité de sms de l'utilisateur.
   * Si le partage de sms est activé, on modifie la quantité de sms
   * de l'utilisateur ayant le plus gros stock.
   *
   * @param array $response réponse de l'API
   * @param string $message
   */
  private async updateSmsQuantity(response: SendSmsResponse, message: string) {
    try {
      const addressee = await this.userRepo
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.group', 'organization')
        .leftJoinAndSelect('user.sms', 'sms')
        .addSelect(
          `CASE WHEN organization.smsSharing = true 
            THEN sms.quantity 
            ELSE (
              CASE WHEN user.id = :user 
              THEN 1 
              ELSE 0 
              END
            )
          END`,
          'orderBy',
        )
        .setParameter('user', this.user.id)
        .orderBy('orderBy', 'DESC')
        .limit(1)
        .getOne();

      const sms: UserSmsEntity = addressee.sms;
      if (sms) {
        sms.quantity -= response.totalCreditsRemoved;
        await this.userSmsRepo.save(sms);
      }

      for (const index in response.ids) {
        const id = response.ids[index];

        const sendingLog = new SendingLogEntity();
        sendingLog.usrId = this.user.id;
        sendingLog.sendingDate = dayjs(new Date()).format();
        sendingLog.receiver = response.validReceivers[index];
        sendingLog.message = message;
        sendingLog.externalReferenceId = id;

        await this.sendingLogRepo.save(sendingLog);
      }
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Converti le numéro de téléphone au format national vers le format international.
   *
   * @throws \InvalidArgumentException
   * @param string $number Numéro de téléphone
   * @param string $countryCode Code pays
   * @return array
   */
  private nationalToInternationalPhoneNumber(
    number: string,
    countryCode: string,
  ): string {
    const phoneNumberUtil = PhoneNumberUtil.getInstance();
    const phoneNumber: PhoneNumber = phoneNumberUtil.parse(number, countryCode);

    if (!phoneNumberUtil.isValidNumber(phoneNumber)) {
      throw new CBadRequestException('VALIDATION_PHONE', {
        attribute: 'phoneNumbers',
      });
    }

    return phoneNumberUtil.format(phoneNumber, PhoneNumberFormat.E164);
  }
}
