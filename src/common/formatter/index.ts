import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

export const addressFormatter = (address) => {
  const street = `${address?.street.trim()} ${address?.street2.trim()}`.trim();
  const zipCodeCity =
    `${address?.zipCode.trim()} ${address?.city.trim()}`.trim();
  const country = `${address?.country.trim()}`.trim();
  let result = '';
  if (street.length > 0) {
    result += `${street}, `;
  }
  if (zipCodeCity.length > 0) {
    result += `${zipCodeCity}, `;
  }
  if (country.length > 0) {
    result += `${country}`;
  }
  return result.trim();
};

export const inseeFormatter = (num) => {
  if (!num) return '';
  const result = num.replace(
    /^([a-zA-Z0-9])([a-zA-Z0-9]{2})([a-zA-Z0-9]{2})([a-zA-Z0-9]{2})([a-zA-Z0-9]{3})([a-zA-Z0-9]{3})([a-zA-Z0-9]{2})?$/,
    '$1 $2 $3 $4 $5 $6 $7',
  );
  return result.replace(/null/g, '');
};

export const phoneNumberFormatter = (phoneNumber: string) => {
  const defaultRegion = 'FR';
  const numberFormat = PhoneNumberFormat.NATIONAL;
  try {
    const phoneNumberUtil = PhoneNumberUtil.getInstance();
    const phoneNumberProto = phoneNumberUtil.parse(phoneNumber, defaultRegion);

    return phoneNumberUtil.format(phoneNumberProto, numberFormat);
  } catch (error) {
    return phoneNumber;
  }
};
