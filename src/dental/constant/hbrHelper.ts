import * as JsBarcode from 'jsbarcode';
import { Canvas } from 'canvas';
import * as hbs from 'handlebars';

export const generateBarcode = (value: string) => {
  const canvas = new Canvas(150, 30);
  JsBarcode(canvas, value, {
    format: 'CODE128',
    displayValue: false,
    width: 1.5,
    height: 45,
  });

  return new hbs.SafeString(canvas.toDataURL('image/png'));
};
