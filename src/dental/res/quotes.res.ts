export class ReduceActRes {
  amountTotal: number;
  amoAmountTotal: number;
  amoRefundTotal: number;
  acts?: ActReduceActRes[];
  patientAmountTotal: number;
}

export class ActReduceActRes {
  amoAmount?: number;
  amoRefund?: number;
  amount?: number;
  cotation: string;
  dentalLocalization: string;
  materials: string;
  maximumPrice?: number;
  panier?: string;
  patientAmount?: number;
  treatmentNumber: number;
  label: string;
}

export class ReduceRacRes {
  amoAmount: number;
  amoAmountRefund: number;
  amoRefund: number;
  code: string;
  dentalLocalization: string;
  madeByPractitioner: boolean;
  materialCode: number;
  maximumPrice: number;
  shortName: string;
  treatmentNumber: number;
}
