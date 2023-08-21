export interface IReminderVisitDateConvert {
  dateOfLastVisit?: string;

  dateOfLastReminder?: string;

  dateOfNextReminder?: string;
}

export interface IReminderCondition {
  where?: string;

  parameters?: Array<string>;
}
