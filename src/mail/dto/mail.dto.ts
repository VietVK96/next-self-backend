export class MailInputsDto {
  header: {
    height: number;
    body: string;
  };
  footer: {
    height: number;
    body: string;
  };
  footer_content: {
    height: number;
    body: string;
  };
  body: string;
}

export class MailOptionsDto {
  preview: boolean;
}
