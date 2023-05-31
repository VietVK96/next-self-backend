export interface MapColumnRows {
  header: string;
  key: string;
  isHide?: boolean;
  isHideGlobal?: boolean;
}

export const mapColumns = (columns: MapColumnRows[], isCanSeeAll: boolean) => {
  const reColums: any = [];

  for (const c of columns) {
    if ((isCanSeeAll && !c.isHideGlobal) || !c.isHide) {
      reColums.push({
        header: c.header,
        key: c.key,
      });
    }
  }
  return reColums;
};
