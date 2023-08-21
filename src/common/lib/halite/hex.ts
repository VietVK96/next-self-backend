export class Hex {
  static decode(encodedString: string, strictPadding = false): string {
    let bin = '';
    let hexLen = encodedString.length;
    let hexPos = 0;
    let cAcc = 0;
    let state = 0;
    if ((hexLen & 1) !== 0) {
      if (strictPadding) {
        throw new Error('Expected an even number of hexadecimal characters');
      } else {
        encodedString = `0${encodedString}`;
        hexLen++;
      }
    }

    // let chunk =
    const chunk = Buffer.from(encodedString, 'ascii');
    while (hexPos < hexLen) {
      const c = chunk.readInt8(hexPos);
      const cNum = c ^ 48;
      const cNum0 = (cNum - 10) >> 8;
      const cAlpha = (c & ~32) - 55;
      const cAlpha0 = ((cAlpha - 10) ^ (cAlpha - 16)) >> 8;
      if ((cNum0 | cAlpha0) === 0) {
        throw new Error('Expected hexadecimal character');
      }
      const cVal = (cNum0 & cNum) | (cAlpha & cAlpha0);
      if (state === 0) {
        cAcc = cVal * 16;
      } else {
        const buf = String.fromCharCode(cAcc | cVal);
        bin = `${bin}${buf}`;
      }
      state ^= 1;
      hexPos++;
    }

    return bin;
  }
}
