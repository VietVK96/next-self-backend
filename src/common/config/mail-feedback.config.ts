import { registerAs } from '@nestjs/config';

export default registerAs('mailFeedBack', () => {
  const suggestion: string[] = (
    process.env?.MAIL_FEED_BACK_SUGGESTION ?? ''
  ).split(',');
  const commercial: string[] = (
    process.env?.MAIL_FEED_BACK_COMMERCIAL ?? ''
  ).split(',');
  const administratif: string[] = (
    process.env?.MAIL_FEED_BACK_ADMINISTRATIF ?? ''
  ).split(',');
  return {
    suggestion,
    commercial,
    administratif,
  };
});
