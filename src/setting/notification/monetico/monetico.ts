import { HmacComputer } from './hmacComputer';
import { PaymentRequest } from './paymentRequest';
export class Monetico {
  /**
   * version du système de paiement utilisée
   */
  static SERVICE_VERSION = '3.0';

  private companyCode: string;
  private eptCode: string;
  private securityKey: string;

  constructor(companyCode?: string, eptCode?: string, securityKey?: string) {
    this.companyCode = companyCode;
    this.eptCode = eptCode;
    this.securityKey = securityKey;
  }

  getFormFields(request: PaymentRequest) {
    const formFields = request.getFormFields(
      this.eptCode,
      this.companyCode,
      Monetico.SERVICE_VERSION,
    );

    const hmacComputer = new HmacComputer();
    const seal = hmacComputer.sealFields(formFields, this.securityKey);
    formFields['MAC'] = seal;

    return formFields;
  }
}
