import puppeteer from 'puppeteer';
import * as hbs from 'handlebars';
import * as fs from 'fs';

type HandlebarsHelpers = {
  [key: string]: hbs.HelperDelegate;
};

type CustomCreatePdfProps = {
  filePath?: string;
  options: any;
  data: any;
  htmlContent?: string;
  helpers?: HandlebarsHelpers;
};

export const customCreatePdf = async ({
  filePath,
  options,
  data,
  htmlContent,
  helpers,
}: CustomCreatePdfProps) => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    hbs.registerHelper(
      'ifCond',
      function (v1: any, operator: any, v2: any, options: any) {
        switch (operator) {
          case '==':
            return v1 == v2 ? options.fn(data) : options.inverse(data);
          case '===':
            return v1 === v2 ? options.fn(data) : options.inverse(data);
          case '!=':
            return v1 != v2 ? options.fn(data) : options.inverse(data);
          case '!==':
            return v1 !== v2 ? options.fn(data) : options.inverse(data);
          case '<':
            return v1 < v2 ? options.fn(data) : options.inverse(data);
          case '<=':
            return v1 <= v2 ? options.fn(data) : options.inverse(data);
          case '>':
            return v1 > v2 ? options.fn(data) : options.inverse(data);
          case '>=':
            return v1 >= v2 ? options.fn(data) : options.inverse(data);
          case '&&':
            return v1 && v2 ? options.fn(data) : options.inverse(data);
          case '||':
            return v1 || v2 ? options.fn(data) : options.inverse(data);
          default:
            return options.inverse(options);
        }
      },
    );

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
    });

    if (helpers) {
      for (const [helperName, helperFunction] of Object.entries(helpers)) {
        hbs.registerHelper(helperName, helperFunction);
      }
    }

    const html = filePath ? fs.readFileSync(filePath, 'utf8') : htmlContent;
    const content = hbs.compile(html)(data);
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
