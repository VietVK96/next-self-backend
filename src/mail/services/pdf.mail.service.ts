import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MailInputsDto, MailOptionsDto } from '../dto/mail.dto';
import * as xpath from 'xpath';

@Injectable()
export class PdfMailService {
  constructor(private dataSource: DataSource) {}

  /**
   * Formatte le corps du courrier pour l'affichage PDF.
   *
   * @param array $inputs Informations du courrier.
   * @param array $options Options.
   *	print: Code Javascript pour impression inclus.
   *	filename: Enregistrement du PDF dans le fichier.
   */
  async pdf(inputs: MailInputsDto, options?: MailOptionsDto) {
    this.addPage(inputs);
    this.clean(inputs);
    this.addPageBreak(inputs);
    this.addFontAndSize(inputs);
    this.resizeTable(inputs);
    if (options?.preview) {
      return inputs.body;
    }
  }

  /**
   * Insertion des balises <page> et <page_header> et <page_footer> pour la génération du PDF.
   *
   * @param array $inputs Informations du courrier.
   *
   * application/Services/Mail.php 746 - 783
   */
  addPage(inputs: MailInputsDto) {
    let backtop = '0';
    let backbottom = '0';
    let pageHeader = '';
    let pageFooter = '';
    // Vérification si une entête existe
    if (inputs?.header) {
      backtop = `${inputs?.header?.height}px`;
      pageHeader = `<page_header>${inputs?.header?.body}</page_header>)`;
    }

    if (inputs?.footer) {
      backbottom = `${inputs?.footer?.height}px`;
      pageFooter = `<page_footer>${inputs?.footer?.body}</page_footer>)`;
    } else if (inputs?.footer_content) {
      backbottom = `${inputs?.footer_content?.height}px`;
      pageFooter = `<page_footer>${inputs?.footer_content?.body}</page_footer>)`;
    }

    const body = `
      <style type="text/css">
      * { font-size: 12pt; font-family: Arial,sans-serif; }
      p { margin: 0; padding: 0; }
      blockquote { padding: 1em 40px; }
      hr { height: 1px; background-color: #000000; }
      ul, ol { margin-top: 1em; margin-bottom: 1em; }
      .mceitemtable, .mceitemtable td, .mceitemtable th, .mceitemtable caption, .mceitemvisualaid { border: 0 !important; }
      .mce-pagebreak { page-break-before:always; }
      </style>
      <page backtop="${backtop}" backright="0" backbottom="${backbottom}" backleft="0" orientation="portrait">
      ${pageHeader}
      ${pageFooter}
      ${inputs?.body}
      </page>
    `;
    inputs.body = body;
  }

  /**
   * Transforme les paragraphes vides en sauts de page.
   * Transforme les espaces insécables en espaces.
   * Supprime l'attribut "align".
   *
   * @param array $inputs Informations du courrier.
   */
  clean(inputs: MailInputsDto) {
    const cleanBlank = inputs.body.replace(
      '/<p[^>]*>(<span[^>]*>)?(s|&nbsp;?)*(</span>)?</p>/',
      '<br>',
    );
    const cleanNonBreakingSpace = cleanBlank.replace('&nbsp;', ' ');
    const cleanAlignAttribute = cleanNonBreakingSpace.replace(
      '/salign="[^"]+"/i',
      '',
    );
    inputs.body = cleanAlignAttribute;
  }

  /**
   * Transforme les commentaires <!-- pagebreak --> en nouvelle page.
   *
   * @param array $inputs Informations du courrier.
   */
  addPageBreak(inputs: MailInputsDto) {
    const tagsAutoClose = [
      'area',
      'base',
      'br',
      'col',
      'command',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'option',
      'circle',
      'ellipse',
      'path',
      'rect',
      'line',
      'polygon',
      'polyline',
    ];
    const pages = inputs.body.split('<!-- pagebreak -->');
    let content = '';

    // Pour chaque page du HTML.
    pages.forEach((page, pageIndex) => {
      page = content + page;
      content = '';
      const tags = [];
      let matches = [];

      const tagRegex = /<(\/?)([^>\s\/]+)([^>]*)?>/g;
      let match: RegExpExecArray;
      while ((match = tagRegex.exec(page)) !== null) {
        matches.push(match);
      }

      // Suppression des balises autofermantes.
      matches = matches.filter((value) => !tagsAutoClose.includes(value[2]));

      // Suppression des balises ouvertes ET fermées.
      matches.forEach((value) => {
        if (!value[1]) {
          tags.push(value[2]);
        } else {
          const offset = tags.indexOf(value[2]);
          if (offset !== -1) {
            tags.splice(offset, 1);
          }
        }
      });

      // Reconstruct the HTML with remaining opening tags.
      const keys = Object.keys(tags);
      const keysReversed = keys.reverse();
      keysReversed.forEach((key) => {
        page += `</${matches[key][2]}>`;
        if (matches[key][2] === 'page') {
          content = `<${matches[key][2]} ${matches[key][3]} pageset="old">${content}`;
        } else {
          content = matches[key][0] + content;
        }
      });

      pages[pageIndex] = page;
    });

    inputs.body = pages.join('');
  }

  /**
   * Récupération des éléments qui ont une police de caractères
   * afin de l'inclure également à tous les éléments enfants.
   *
   * @param array $inputs Informations du courrier.
   */
  addFontAndSize(inputs: MailInputsDto) {
    // Assuming inputs['body'] contains the HTML string
    const htmlString =
      '<?xml encoding="utf-8" ?><div>' + inputs.body + '</div>';

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(htmlString, 'text/html');
    const dom = new DOMParser().parseFromString(
      `<?xml encoding="utf-8" ?><div>${inputs.body}</div>`,
      'text/xml',
    );
    const nodes = xpath.select(
      'descendant-or-self::*[contains(@style,"font-family") or contains(@style,"font-size")]',
      dom,
    ) as HTMLElement[];

    for (const node of nodes) {
      let style = node.getAttribute('style');
      let matches: string[];

      this.removeDataMceAttributes(node);

      if ((matches = style.match(/font-family[^;]+;/))) {
        const styleFontFamily = matches[0].replace(/'/g, '');
        style = style.replace(matches[0], styleFontFamily);
        node.setAttribute('style', style);

        const childs = this.evaluateXPath(
          './/descendant::*[not(contains(@style,"font-family"))]',
          node,
        );
        this.integrateStyleIntoChilds(childs, styleFontFamily);
      }

      if ((matches = style.match(/font-size[^;]+;/))) {
        const styleFontSize = matches[0];

        const childs = this.evaluateXPath(
          './/descendant::*[not(contains(@style,"font-size"))]',
          node,
        );
        document.getElementById('a');
        this.integrateStyleIntoChilds(childs, styleFontSize);
      }
    }

    const selectNodes = xmlDoc.getElementsByTagName('select');
    let index = selectNodes.length - 1;

    while (index > -1) {
      const node = selectNodes[index];
      const selectedOption =
        node.querySelector('option[selected]') || node.querySelector('option');

      const replacementNode = xmlDoc.createElement('div');
      replacementNode.textContent = selectedOption
        ? selectedOption.textContent
        : '';

      node.parentNode.replaceChild(replacementNode, node);

      index--;
    }
    // Transformation du DOM en chaine de caractères + suppression des commentaires.
    const xmlString = new XMLSerializer().serializeToString(
      xmlDoc.documentElement,
    );
    const startIndex = xmlString.indexOf('<div>');
    const endIndex = xmlString.lastIndexOf('</div>');
    inputs.body = xmlString.slice(startIndex + 5, endIndex);
  }

  public removeDataMceAttributes(node: HTMLElement) {
    for (const attribute of node.attributes) {
      if (attribute.nodeName.match(/^data-mce-/i)) {
        node.removeAttribute(attribute.nodeName);
      }
    }
  }

  // Function to evaluate XPath expressions
  public evaluateXPath(
    xpathExpression: string,
    contextNode: HTMLElement,
  ): HTMLElement[] {
    const parser = new DOMParser();
    const doc: Document = parser.parseFromString(
      contextNode.outerHTML,
      'text/html',
    );

    const select = xpath.useNamespaces({});
    const nodes = select(xpathExpression, doc) as Node[];
    const elementNodes: HTMLElement[] = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType === 1) {
        elementNodes.push(node as HTMLElement);
      }
    }

    return elementNodes;
  }

  public integrateStyleIntoChilds(
    childs: HTMLElement[],
    styleAttribute: string,
  ) {
    for (const child of childs) {
      let attribute = styleAttribute;
      if (child.hasAttribute('style')) {
        attribute += child.getAttribute('style');
      }
      child.setAttribute('style', attribute);
    }
  }

  public resizeTable(inputs: MailInputsDto) {
    // Assuming inputs['body'] contains the HTML string
    const htmlString =
      '<?xml encoding="utf-8" ?><div>' + inputs.body + '</div>';

    // Create a new DOMParser object and parse the HTML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(htmlString, 'text/html');

    // Function to transform table elements and their columns
    // Call the function to transform table elements and columns
    this.transformTables(xmlDoc);

    // Transformation du DOM en chaine de caractères + suppression des commentaires.
    const xmlString = new XMLSerializer().serializeToString(
      xmlDoc.documentElement,
    );
    const startIndex = xmlString.indexOf('<div>');
    const endIndex = xmlString.lastIndexOf('</div>');
    inputs.body = xmlString.slice(startIndex + 5, endIndex);
    return inputs;
  }

  public transformTables(xmlDoc: Document) {
    const nodes = xmlDoc.getElementsByTagName('table');
    // Create a new DOMXPath object for XPath queries
    const xpath = new XPathEvaluator();
    for (const node of nodes ?? []) {
      // Insertion d'une largeur de 100% aux balises <table>.
      if (
        !node.hasAttribute('width') &&
        !node.getAttribute('style').match(/width\:/)
      ) {
        node.setAttribute('style', 'width: 100%;' + node.getAttribute('style'));
      }

      // Insertion d'une largeur aux colonnes des tableaux.
      const rows = node.getElementsByTagName('tr');
      for (const row of rows) {
        const cols = xpath.evaluate(
          './/td|.//th',
          row,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
        const length = cols.snapshotLength;
        const width = 100 / length;
        for (let i = 0; i < length; i++) {
          const col = cols.snapshotItem(i) as HTMLElement;
          if (
            !col.hasAttribute('width') &&
            !col.getAttribute('style').match(/width\:/)
          ) {
            col.setAttribute(
              'style',
              'width: ' + width + '%;' + col.getAttribute('style'),
            );
          }
        }
      }
    }
  }
}
