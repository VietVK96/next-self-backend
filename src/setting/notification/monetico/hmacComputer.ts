import * as crypto from 'crypto';

export class HmacComputer {
  sealFields(formFields: Record<string, any>, key: string): string | false {
    const stringToSeal = this.getStringToSeal(formFields);
    return this.sealString(stringToSeal, this.getUsableKey(key));
  }

  getStringToSeal(formFields: Record<string, any>): string {
    const sortedFields = Object.keys(formFields).sort();
    const fieldStrings = sortedFields.map((key) => `${key}=${formFields[key]}`);
    return fieldStrings.join('*');
  }

  private sealString(stringToSeal: string, key: string): string | false {
    const hmac = crypto.createHmac('sha1', Buffer.from(key, 'hex'));
    hmac.update(stringToSeal);
    return hmac.digest('hex');
  }

  private getUsableKey(key: string): string {
    const hexStrKey = key?.substring(0, 38);
    const hexFinal = key ? `${key?.substring(38, 2)}00` : '00';

    const cca0 = hexFinal.charCodeAt(0);

    let modifiedKey: string;
    if (cca0 > 70 && cca0 < 97) {
      modifiedKey =
        hexStrKey + String.fromCharCode(cca0 - 23) + hexFinal.substring(1, 1);
    } else {
      if (hexFinal.substring(1, 1) === 'M') {
        modifiedKey = hexStrKey + hexFinal.substring(0, 1) + '0';
      } else {
        modifiedKey = hexStrKey + hexFinal.substring(0, 2);
      }
    }

    return modifiedKey;
  }
}
