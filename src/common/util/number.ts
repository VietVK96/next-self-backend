export const checkId = (id: any): number | null => {
  return Number(id) && Number(id) !== 0 ? Number(id) : null;
};

export const checkNumber = (num: number | string): number => {
  return Number(num) ? Number(num) : 0;
};

export const toFixed = (
  num: number | string | undefined | null,
  fixed = 2,
): number => {
  return Number(num) ? +Number(num).toFixed(fixed) : 0.0;
};

export function checkBoolean(
  value: string | number | null | undefined,
): boolean {
  if (typeof value === 'string' && value === 'false') return false;
  return value ? true : false;
}

export function convertBooleanToNumber(
  value: string | boolean | null | undefined,
): number {
  return value ? 1 : 0;
}
