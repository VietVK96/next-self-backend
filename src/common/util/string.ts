export const makeRandomString = (len: number, chars: string): string => {
  let mask = '';
  if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
  if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (chars.indexOf('#') > -1) mask += '0123456789';
  if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
  let result = '';
  for (let i = len; i > 0; --i) {
    result += mask[Math.floor(Math.random() * mask.length)];
  }
  return result;
};

export const getBetween = (str: string, start: string, end: string) => {
  return str.split(start).pop().split(end)[0];
};

export const checkEmpty = (value: any) => {
  switch (value) {
    case 0:
    case '0':
    case '':
    case []:
    case null:
    case undefined:
    case false:
      return true;
    default:
      return false;
  }
};
/**
 * This function is same as PHP's nl2br() with default parameters.
 *
 * @param {string} str Input text
 * @param {boolean} replaceMode Use replace instead of insert
 * @param {boolean} isXhtml Use XHTML
 * @return {string} Filtered text
 */
export function nl2br(str: string, replaceMode?: string, isXhtml?: boolean) {
  if (!str) return '';
  const breakTag = isXhtml ? '<br />' : '<br>';
  const replaceStr = replaceMode ? '$1' + breakTag : '$1' + breakTag + '$2';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, replaceStr);
}

/**
 * This function inverses text from PHP's nl2br() with default parameters.
 * @param {string} str Input text
 *
 * @param {boolean} replaceMode Use replace instead of insert
 * @return {string} Filtered text
 */
export function br2nl(str: string, replaceMode?: string) {
  const replaceStr = replaceMode ? '\n' : '';
  if (!str) return '';
  // Includes <br>, <BR>, <br />, </br>
  return str.replace(/<\s*\/?br\s*[\/]?>/gi, replaceStr);
}

export function htmlEntities(str: string | number) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
