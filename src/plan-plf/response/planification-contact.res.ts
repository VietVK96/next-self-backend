export class PlanificationContactRes {
  id?: number;
  name?: string;
  type?: string;
  amount?: number;
  mutualCeiling?: number;
  personRepayment?: number;
  personAmount?: number;
  acceptedOn?: string;
  events?: [
    {
      id?: number;
      eventId?: number;
      name?: string;
      delay?: number;
      duration?: string;
      start?: string | null;
      end?: string | null;
    },
  ];
}
