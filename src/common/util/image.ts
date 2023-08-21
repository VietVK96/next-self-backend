import * as bwipjs from 'bwip-js';

type BwipOptionsProps = {
  text?: string;
  bcid?: string;
  scale?: number;
  height?: number;
  width?: number;
  scaleX?: number;
  scaleY?: number;
  includetext?: boolean;
  textxalign?: string;
  rotate?: 'N' | 'R' | 'L' | 'I';
  padding?: number;
  paddingwidth?: number;
  paddingheight?: number;
  paddingtop?: number;
  paddingleft?: number;
  paddingbottom?: number;
  paddingright?: number;
  backgroundcolor?: number;
};

export const generateBarcode = async (options: BwipOptionsProps) => {
  options = {
    bcid: 'code128',
    scaleX: 3,
    scaleY: 1,
    includetext: false,
    ...options,
  };
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(options, function (error, buffer) {
      if (error) {
        reject(error);
      } else {
        const gifBase64 = `data:image/gif;base64,${buffer.toString('base64')}`;
        resolve(gifBase64);
      }
    });
  });
};
