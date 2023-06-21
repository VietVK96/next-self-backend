export const parseJson = <T>(t: string | null | undefined): T | undefined => {
  if (!t) {
    return undefined;
  }
  try {
    const data = JSON.parse(t as string) as T;
    return data;
  } catch (e) {
    return undefined;
  }
};
