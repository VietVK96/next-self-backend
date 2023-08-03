import puppeteer from 'puppeteer';
import * as hbs from 'handlebars';
import * as fs from 'fs';

export type HandlebarsHelpers = {
  [key: string]: hbs.HelperDelegate;
};

export type PdfTemplateFile = {
  path: string;
  data: any;
  type?: string;
};
type CustomCreatePdfProps = {
  files: PdfTemplateFile[];
  options: any;
  helpers?: HandlebarsHelpers;
};

export const customCreatePdf = async ({
  files,
  options,
  helpers,
}: CustomCreatePdfProps) => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    hbs.registerHelper({
      eq: (v1: any, v2: any) => v1 === v2,
      ne: (v1: any, v2: any) => v1 !== v2,
      lt: (v1: number, v2: number) => v1 < v2,
      gt: (v1: number, v2: number) => v1 > v2,
      lte: (v1: number, v2: number) => v1 <= v2,
      gte: (v1: number, v2: number) => v1 >= v2,
      and: (...args) => args.every(Boolean),
      or(...args) {
        const argsExceptLast = args.slice(0, -1);
        return argsExceptLast.some(Boolean);
      },
      isset: (v1: any) => {
        if (Number(v1)) return true;
        return v1 ? true : false;
      },
      notIsset: (v1: any) => {
        return v1 ? false : true;
      },
      notEmpty: (v1: any) => {
        if (Array?.isArray(v1) || typeof v1 === 'string') {
          return v1.length !== 0;
        }
        if (typeof v1 === 'object') {
          return Object.keys(v1).length !== 0;
        }
      },
      isEmpty: (v1: any) => {
        if (!v1) return true;
        if (Array?.isArray(v1) || typeof v1 === 'string') {
          return v1.length === 0;
        }
        if (typeof v1 === 'object') {
          return Object.keys(v1).length === 0;
        }
      },
      join: (v1: string[], v2: string) => {
        return v1.join(v2);
      },
    });

    if (helpers) {
      for (const [helperName, helperFunction] of Object.entries(helpers)) {
        hbs.registerHelper(helperName, helperFunction);
      }
    }

    const contents = files.map((file) => {
      if (file?.type && file?.type === 'string') return file.data;
      return hbs.compile(fs.readFileSync(file.path, 'utf8'))(file.data);
    });
    const content = contents.join('');
    await page.setContent(content);
    const buffer = await page.pdf({
      // path: 'output-abc.pdf',
      format: 'a4',
      printBackground: true,
      margin: {
        left: '10mm',
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
      },
      ...options,
    });
    await browser.close();
    // process.exit();
    return buffer;
  } catch (e) {
    console.log(e);
  }
};
