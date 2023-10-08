import * as dayjs from 'dayjs';

export const convertTimeZoneToNumber = (timezone?: string) => {
  const offset = timezone
    ? dayjs().tz(timezone).utcOffset()
    : dayjs().utcOffset();

  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetSign = offset >= 0 ? '+' : '-';

  const offsetString = `${offsetSign}${String(offsetHours).padStart(
    2,
    '0',
  )}:${String(offsetMinutes).padStart(2, '0')}`;
  return offsetString;
};
