export const checkId = (id: number): number | null => {
  return Number(id) && Number(id) !== 0 ? Number(id) : null;
};
export const checkNumber = (id: number): number | null => {
  return Number(id) || Number(id) === 0 ? Number(id) : null;
};
