export class ShowOdontogramDto {
  name?: string;
  status?: 'planned' | 'current' | 'initial';
  imageToURL?: boolean;
  conId?: number;
  pdf?: boolean;
}

export class applyStylesDto {
  nums: string;
  backgroundColor: string;
  displayCrown: boolean;
  displayRoot: boolean;
  displayImplant: boolean;
  displayXray: boolean;
  zoneVisibles: string[];
  zoneInvisibles: string[];
}
