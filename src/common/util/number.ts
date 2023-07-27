export const checkId = (id: any): number | null => {
  return Number(id) && Number(id) !== 0 ? Number(id) : null;
};
export const checkNumber = (num: number | string): number | null => {
  return Number(num) || Number(num) === 0 ? Number(num) : null;
};

export const toFixed = (
  num: number | string | undefined | null,
  fixed = 2,
): number => {
  return Number(num) ? +Number(num).toFixed(fixed) : 0.0;
};
