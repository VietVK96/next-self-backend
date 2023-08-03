import * as dayjs from 'dayjs';

export function checkDay(day: any, format = 'YYYY-MM-DD'): string {
  const a = dayjs(day);
  return a.isValid() ? a.format(format) : '';
}

export const customDayOfYear = (day?: string | dayjs.Dayjs): string => {
  const today = day ? (typeof day === 'string' ? dayjs(day) : day) : dayjs();
  const dayOfYear = (today.diff(today.startOf('year'), 'day') + 1)
    .toString()
    .padStart(3, '0');
  return dayOfYear;
};
