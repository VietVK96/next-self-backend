import * as dayjs from 'dayjs';

export function checkDay(day: any, format = 'YYYY-MM-DD'): string {
  const a = dayjs(day);
  return a.isValid() ? a.format(format) : '';
}
