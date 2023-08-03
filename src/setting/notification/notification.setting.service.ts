import { Injectable } from '@nestjs/common';
import {
  AddressEntity,
  hasAllFieldsRequiredForBilling,
} from 'src/entities/address.entity';
import { UserEntity } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import { OrderContextBilling } from './monetico/orderContextBilling';
import { OrderContextClient } from './monetico/orderContextClient';
import { OrderContext } from './monetico/orderContext';
import { StringHelper } from 'src/common/util/string-helper';
import { PaymentRequest } from './monetico/paymentRequest';
import { Monetico } from './monetico/monetico';
import { Request } from 'express';

@Injectable()
export class NotificationSettingService {
  constructor(private dataSource: DataSource) {}

  async find(userId: number, request: Request) {
    const user = await this.dataSource.getRepository(UserEntity).findOneOrFail({
      where: { id: userId },
      relations: {
        address: true,
        group: {
          address: true,
        },
      },
    });
    const products = {};
    let address: AddressEntity = user?.address;
    if (!hasAllFieldsRequiredForBilling(address)) {
      address = user?.group?.address;
    }

    console.log(address);
    if (address && hasAllFieldsRequiredForBilling(address)) {
      const billing = new OrderContextBilling(
        address.street,
        address.city,
        address.zipCode,
        address.countryAbbr,
      );
      billing.setFirstName(user.firstname);
      billing.setLastName(user.lastname);
      billing.setEmail(user.email);

      const client = new OrderContextClient();
      client.setFirstName(user.firstname);
      client.setLastName(user.lastname);
      client.setEmail(user.email);

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
      pack100smsPaymentRequest.setMail(user.email);
      pack100smsPaymentRequest.setUrlRetourOk(request.url);
      pack100smsPaymentRequest.setUrlRetourErreur(request.url);
      pack100smsPaymentRequest.setTexteLibre(
        JSON.stringify({
          id: user.id,
          lastName: user.lastname,
          firstName: user.faxNumber,
          product: 'PACK100SMS',
        }),
      );

      const pack500smsPaymentRequest = new PaymentRequest(
        reference,
        69.0,
        'EUR',
        'FR',
        context,
        user.email,
        request.url,
        request.url,
      );
      pack500smsPaymentRequest.setTexteLibre(
        JSON.stringify({
          id: user.id,
          lastName: user.lastname,
          firstName: user.faxNumber,
          product: 'PACK500SMS',
        }),
      );

      const pack1000smsPaymentRequest = new PaymentRequest(
        reference,
        120.0,
        'EUR',
        'FR',
        context,
        user.email,
        request.url,
        request.url,
      );
      pack1000smsPaymentRequest.setTexteLibre(
        JSON.stringify({
          id: user.id,
          lastName: user.lastname,
          firstName: user.faxNumber,
          product: 'PACK1000SMS',
        }),
      );

      const monetico = new Monetico();
      products['pack100sms'] = monetico.getFormFields(pack100smsPaymentRequest);
      products['pack500sms'] = monetico.getFormFields(pack500smsPaymentRequest);
      products['pack1000sms'] = monetico.getFormFields(
        pack1000smsPaymentRequest,
      );

      console.log(products);
      return products;
    }
  }
}
