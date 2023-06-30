import { format } from 'date-fns';

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
  const result = num.replace(
    /^([a-zA-Z0-9])([a-zA-Z0-9]{2})([a-zA-Z0-9]{2})([a-zA-Z0-9]{2})([a-zA-Z0-9]{3})([a-zA-Z0-9]{3})([a-zA-Z0-9]{2})?$/,
    '$1 $2 $3 $4 $5 $6 $7',
  );
  return result.replace(/null/g, '');
};

export const dateFormatter = (date: '') => {
  if (!date) return null;
  const day = new Date(date);
  return format(day, 'dd/MM/yyyy');
};
