import * as dayjs from 'dayjs';
import { PrintPDFOptions } from 'src/common/util/pdf';

export const helpersCaresheetPdf = {
  formatDate: function (date: string) {
    return dayjs(date).format('DDMMYYYY');
  },
  formatInsee: function (s1: string, s2: string) {
    let string = s1?.concat(s2 ?? '');
    if (!string) return '';
    string = string?.replace(/\W/g, '')?.toUpperCase();
    return string?.replace(
      /(\w{1})(\w{2})(\w{2})(\w{2})(\w{3})(\w{3})(\w{2})/,
      '$1 $2 $3 $4 $5 $6 $7',
    );
  },
  formatDateISO: function (date: string) {
    return dayjs(date).format('DD/MM/YYYY');
  },
  slice: function (str: string, start: number, end: number) {
    if (!str) return;
    return str.toString().slice(start, end);
  },
  padStart: function (value: string, num: number) {
    if (!value) return;
    return value.padStart(num, '');
  },
  padEnd: function (value: string, num: number) {
    if (!value) return;
    return value.padEnd(num, '');
  },
  joinAndReplace: function (string: string[], key: string, value: string) {
    if (!string) return;
    return string.join('').replace(key, value);
  },
  setVar: function (varName: string, varValue: string, options) {
    options.data.root[varName] = varValue;
  },
  concatString: function (s1: string, s2: string) {
    return s1.concat(s2);
  },
  math: function (lvalue: number, operator: string, rvalue: number) {
    lvalue = parseFloat(`${lvalue}`);
    rvalue = parseFloat(`${rvalue}`);
    return {
      '+': lvalue + rvalue,
      '-': lvalue - rvalue,
      '*': lvalue * rvalue,
      '/': lvalue / rvalue,
      '%': lvalue % rvalue,
    }[operator];
  },
  table: function (context: string | null) {
    if (!context) return;
    const listItem = context.toString().split('');
    const width = Math.floor(100 / listItem.length);
    let str = `
    <table class="text-center">
      <tbody>
        <tr>`;
    for (let i = 0, j = listItem.length; i < j; i++) {
      str += `<td style="width: ${width}%;">${listItem[i]}</td>`;
    }
    str += `
        </tr>
      </tbody>
    </table>`;
    return str;
  },
  nameToTransmit: (key: string) => {
    return key === 'CBX' ? 'CCX' : key;
  },
  formatNumber: (n: number) => {
    return Number(n).toFixed(2);
  },
};

export const optionsCaresheetPdf: PrintPDFOptions = {
  format: 'A4',
  displayHeaderFooter: true,
  landscape: true,
  headerTemplate: `<div></div`,
  // `
  //   <div style="width: 100%; font-size: 7pt; display: flex; justify-content: space-between;">
  //     <div style='width: 50%; font-size: 7pt; margin-left: 10mm'>
  //       ${dayjs().format('DD/MM/YYYY, HH:mm: A')}
  //     </div>
  //     <div style='width: 50%; font-size: 7pt;'>
  //       Suivi de télétransmission - weClever
  //     </div>
  //   </div>`,
  footerTemplate: `
    <div style="width: 100%; font-size: 7pt; display: flex; justify-content: end;">
      <div style='font-size: 7pt; margin-right: 10mm'>
        <span class="pageNumber"></span>/<span class="totalPages"></span>
      </div>
    </div>
    `,
  margin: {
    left: '10mm',
    top: '25mm',
    right: '10mm',
    bottom: '15mm',
  },
};
