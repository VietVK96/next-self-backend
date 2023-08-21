import * as assert from 'assert';
import * as crypto from 'crypto';

export const hashEquals = (answer: string, guess: string): boolean => {
  assert(
    typeof answer === 'string' && typeof guess === 'string',
    'both arguments should be strings',
  );

  const rb = crypto.pseudoRandomBytes(32);
  const ahmac = crypto.createHmac('sha256', rb).update(answer).digest('hex');
  const ghmac = crypto.createHmac('sha256', rb).update(guess).digest('hex');

  const len = ahmac.length;

  let result = 0;
  for (let i = 0; i < len; ++i) {
    result |= ahmac.charCodeAt(i) ^ ghmac.charCodeAt(i);
  }
  return result === 0;
};
