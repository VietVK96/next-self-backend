export const checkId = (id: any): number | null => {
  return Number(id) && Number(id) !== 0 ? Number(id) : null;
};
export const checkNumber = (id: number | string): number | null => {
  return Number(id) || Number(id) === 0 ? Number(id) : null;
};
