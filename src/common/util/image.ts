import * as bwipjs from 'bwip-js';

type BwipOptionsProps = {
  text?: string;
  bcid?: string;
  scale?: number;
  height?: number;
  width?: number;
  includetext?: boolean;
  textxalign?: string;
  rotate?: 'N' | 'R' | 'L' | 'I';
  padding?: string;
  paddingwidth?: string;
  paddingheight?: string;
  paddingtop?: string;
  paddingleft?: string;
  paddingbottom?: string;
  paddingright?: string;
  backgroundcolor?: string;
};

export const generateBarcode = async (options: BwipOptionsProps) => {
  options = {
    bcid: 'code128',
    scale: 1.5,
    height: 10,
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
