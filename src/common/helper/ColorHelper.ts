/**
 * convert from application/Helpers/ColorHelper.php
 *
 * Fonctions d'aides sur les couleurs hexadécimale, RGB et 4D.
 */
class ColorHelper {
  /**
   * @let array Couleurs héxadécimales.
   */
  colors = [
    '#ffffff',
    '#ffff00',
    '#ff6600',
    '#ff0000',
    '#ff0099',
    '#000099',
    '#0000ff',
    '#0099ff',
    '#00cc00',
    '#009900',
    '#663300',
    '#333333',
    '#cccccc',
    '#996600',
    '#999999',
    '#000000',
    '#ff005a',
    '#ff0052',
    '#ff004a',
    '#ff0031',
    '#ff0021',
    '#ff0018',
    '#ff0010',
    '#ff0000',
    '#ff0000',
    '#ff0000',
    '#ff0800',
    '#ff1800',
    '#ff2100',
    '#ff3100',
    '#ff3900',
    '#ff4200',
    '#ff4a00',
    '#ff5200',
    '#ff5a00',
    '#ff6300',
    '#ff6b00',
    '#ff7300',
    '#ff7b00',
    '#ff8400',
    '#ff8c00',
    '#ff9400',
    '#ff9c00',
    '#ffa500',
    '#ff9c00',
    '#ffad10',
    '#ffb500',
    '#ffbd00',
    '#ffc600',
    '#ffc600',
    '#ffce00',
    '#ffd600',
    '#ffde00',
    '#ffe700',
    '#ffef08',
    '#fff700',
    '#ffff00',
    '#ffff00',
    '#f7ff00',
    '#efff00',
    '#e7ff00',
    '#d6ff00',
    '#ceff00',
    '#c6ff00',
    '#bdff00',
    '#a5ff00',
    '#94ff00',
    '#7bff00',
    '#63ff00',
    '#4aff00',
    '#39ff00',
    '#08ff00',
    '#00ff08',
    '#00ff21',
    '#00ff31',
    '#00ff4a',
    '#00ff63',
    '#00ff73',
    '#00ff8c',
    '#00ffa5',
    '#00ffa5',
    '#00ffb5',
    '#00ffbd',
    '#00ffc6',
    '#00ffd6',
    '#00ffde',
    '#00ffe7',
    '#00ffef',
    '#00ffff',
    '#00ffff',
    '#00f7ff',
    '#00efff',
    '#00e7ff',
    '#00d6ff',
    '#00ceff',
    '#00c6ff',
    '#00b5ff',
    '#00a5ff',
    '#008cff',
    '#007bff',
    '#006bff',
    '#0052ff',
    '#0042ff',
    '#0029ff',
    '#0018ff',
    '#0008ff',
    '#0000ff',
    '#1800ff',
    '#2900ff',
    '#3900ff',
    '#5200ff',
    '#6300ff',
    '#7b00ff',
    '#8c00ff',
    '#9c00ff',
    '#b500ff',
    '#c600ff',
    '#d600ff',
    '#ef00ff',
    '#ff00ff',
    '#ff00ef',
    '#ff00de',
    '#ff00ce',
    '#ff00b5',
    '#ff00a5',
    '#ff0094',
    '#ff007b',
    '#ff006b',
    '#ffe7e7',
    '#ffc6c6',
    '#ffa5a5',
    '#ff7b7b',
    '#ff5a5a',
    '#ff4242',
    '#ff2121',
    '#ff0000',
    '#ef0800',
    '#de0000',
    '#ce0000',
    '#b50000',
    '#9c0000',
    '#8c0000',
    '#730000',
    '#630000',
    '#fff7de',
    '#ffe7c6',
    '#ffcea5',
    '#ffbd7b',
    '#ffb55a',
    '#ffa542',
    '#ff9421',
    '#ff8400',
    '#ef7300',
    '#de6b00',
    '#c66300',
    '#b55a00',
    '#9c5200',
    '#8c4200',
    '#733900',
    '#633100',
    '#ffffde',
    '#ffffc6',
    '#ffffa5',
    '#ffff7b',
    '#ffff5a',
    '#ffff42',
    '#ffff21',
    '#ffff00',
    '#efef00',
    '#d6d600',
    '#c6c600',
    '#adad00',
    '#9c9c00',
    '#848c00',
    '#737300',
    '#5a6300',
    '#e7ffde',
    '#c6ffc6',
    '#a5ffa5',
    '#8cff7b',
    '#6bff5a',
    '#4aff42',
    '#31ff21',
    '#10ff00',
    '#10ef00',
    '#10de00',
    '#08c600',
    '#08b500',
    '#089c00',
    '#088c00',
    '#087300',
    '#006300',
    '#deffff',
    '#c6ffff',
    '#a5ffff',
    '#7bffff',
    '#5affff',
    '#42ffff',
    '#21ffff',
    '#00ffff',
    '#00efef',
    '#00d6de',
    '#00c6c6',
    '#00adb5',
    '#009c9c',
    '#00848c',
    '#007373',
    '#005a63',
    '#dee7ff',
    '#c6ceff',
    '#a5adff',
    '#7b94ff',
    '#5a7bff',
    '#425aff',
    '#2142ff',
    '#0021ff',
    '#0021ef',
    '#0021de',
    '#0021ce',
    '#0018b5',
    '#00189c',
    '#00108c',
    '#001073',
    '#000863',
    '#ffdeff',
    '#ffc6ff',
    '#ffa5ff',
    '#ff7bff',
    '#ff5aff',
    '#ff42ff',
    '#ff21ff',
    '#ff00ff',
    '#ef00ef',
    '#d600de',
    '#ce00ce',
    '#b500b5',
    '#9c009c',
    '#8c008c',
    '#730073',
    '#630063',
    '#ffffff',
    '#efefef',
    '#dedede',
    '#cecece',
    '#c6c6c6',
    '#adadad',
    '#9c9c9c',
    '#8c8c8c',
    '#737373',
    '#636363',
    '#525252',
    '#424242',
    '#313131',
    '#212121',
    '#101010',
    '#000000',
  ];

  /**
   * @let array Indice blanc/noire de la couleur de la police de caractères.
   */
  fontColors = [
    15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15, 15, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15, 15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 15, 15, 15, 15, 15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15, 15,
    15, 15, 15, 15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 15, 15, 15, 15, 15, 15, 15,
    15, 15, 15, 0, 0, 0, 0, 0, 0, 15, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15, 15, 15, 15,
    15, 15, 15, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  /**
   * @let object Nom des couleurs et leurs équivalents en hexadécimale.
   */
  names = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgrey: '#a9a9a9',
    darkgreen: '#006400',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    grey: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgrey: '#d3d3d3',
    lightgreen: '#90ee90',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slatgray: '#708090',
    slatgrey: '#708090',
    snow: '#fafa',
    springgren: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32',
  };

  /**
   * Convertion d'une représentation 4D d'une couleur en représentation hexadécimale
   * pour la couleur de fond et la couleur de texte.
   *
   * @param integer $integer La couleur 4D à convertir.
   * @return array Retourne un tableau contenant la représentation hexadécimale de la couleur de fond et la couleur de texte.
   */
  inthex(integer: number) {
    const array = [this.colors[0], this.colors[15]];
    const backgroundColor = Math.floor(Math.abs(integer / 256)).toFixed();
    const fontColor = Math.ceil(Math.abs(integer % 256)).toFixed();
    if (this.colors[backgroundColor]) array[0] = this.colors[backgroundColor];
    if (this.colors[fontColor]) array[1] = this.colors[fontColor];
    return array;
  }

  /**
   * Conversion d'une représentation hexadécimale d'une couleur en représentation 4D.
   * Si la représentation hexadécimale n'existe pas, on retourne une valeur par défaut.
   *
   * @param  string $string La couleur hexadécimale à convertir.
   * @return integer Retourne la représentation 4D de la couleur.
   */
  hexint(string: string, num = -15) {
    const index = this.colors.findIndex((color) => color === string);
    if (index !== -1) return -(this.fontColors[index] + (256 + index));
    return num;
  }

  /**
   * Convertion d'une représentation hexadécimale d'une couleur en représentation 4D la plus proche.
   *
   * @param  string $string La couleur hexadécimale à convertir.
   * @return string Retourne la plus proche représentation 4D d'une couleur.
   */
  closest(string: string) {
    let min = Number.MAX_SAFE_INTEGER;
    let color = null;
    const array = this.hexrgb(string);
    const colors = this.colors; // Assuming you have defined an array named colorsArray

    colors.forEach((hexColor) => {
      const rgbColor = this.hexrgb(hexColor);
      const delta =
        Math.pow(Math.abs(array[0] - rgbColor[0]), 2) +
        Math.pow(Math.abs(array[1] - rgbColor[1]), 2) +
        Math.pow(Math.abs(array[2] - rgbColor[2]), 2);

      if (delta < min) {
        min = delta;
        color = hexColor;
      }
    });

    return this.hexint(color);
  }

  /**
   * Convertion d'une représentation RGB d'une couleur en représentation hexadécimale.
   *
   * @param  array $array La couleur RGB à convertir.
   * @return string Retourne la représentation hexadécimale de la couleur.
   */
  rgbhex(array: number[]) {
    const red = array[0];
    const green = array[1];
    const blue = array[2];
    const hexRed = this.prependZeroIfNecessary(red.toString(16));
    const hexGreen = this.prependZeroIfNecessary(green.toString(16));
    const hexBlue = this.prependZeroIfNecessary(blue.toString(16));
    return '#' + hexRed + hexGreen + hexBlue;
  }

  /**
   * Convertion d'une représentation hexadécimale d'une couleur en représentation RGB.
   *
   * @param  string string La couleur hexadécimale à convertir.
   * @return array Retourne la représentation RGB de la couleur.
   */
  hexrgb(string: string) {
    string = this.normalizeHex(string);
    const r = parseInt(string.substring(1, 2), 16);
    const g = parseInt(string.substring(3, 2), 16);
    const b = parseInt(string.substring(5, 2), 16);
    return [r, g, b];
  }

  /**
   * Convertion d'une représentation hexadécimale d'une couleur en représentation RGB
   * pouvant être utilisée en CSS.
   *
   * @param  string $string Le couleur hexadécimale à convertir.
   * @return array Retourne la représentation RGB de la couleur au format rgb(R,G,B).
   */
  hexrgbStyle(string: string) {
    const rgb = this.hexrgb(string);
    return 'rgb(' + rgb.join(',') + ')';
  }

  /**
   * Eclaircissement ou assombrissement de la couleur en fonction de la valeur amt :
   * supérieur à 0 -> eclaircissement
   * inférieur à 0 -> assombrissement
   *
   * @param  string $string La couleur hexadécimale à convertir.
   * @param  integer $amt La valeur d'éclaircissement ou d'assombrissement.
   * @return string Retourne la chaîne au format hexadécimale.
   */
  lightenDarken(string: string, amt: any) {
    const num = parseInt(string.substring(1), 16);
    const red = Math.max(0, Math.min(255, (num >> 16) + amt));
    const green = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const blue = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return this.rgbhex([red, green, blue]);
  }

  /**
   * Normalisation d'une représentation hexadécimale d'une couleur.
   *
   * @throws \InvalidArgumentException
   * @param  string $string La chaîne à normaliser.
   * @return string Retourne la couleur hexadécimale en minuscule.
   */
  normalizeHex(string: string) {
    /**
     * / TODO add Throw Exception
     */
    if (this.isValidHex(string)) {
      // throw new InvalidArgumentException(sprintf("%s is not a valid hex color.", $string));
    }

    // #RGB -> #RRGGBB
    if (string.length === 4) {
      string = string.replace(/#(.)(.)(.)/g, '#$1$1$2$2$3$3');
    }

    return string.toLowerCase();
  }

  /**
   * Détermine si la chaîne donnée est une représentation hexadécimale valide.
   * La chaine peut être au format #RRGGBB ou #RGB.
   *
   * @param string $string La chaîne à vérifier.
   * @return boolean Retourne VRAI si la chaîne est une représentation hexadécimale valide.
   */
  isValidHex(string: string) {
    const isValid = /^#(?:[a-f0-9]{3}){1,2}$/i.test(string);
    return isValid;
  }

  /**
   * Détermine si la chaîne donnée est une représentation RGB valide.
   * La chaine peut être au format '(r,g,b)' ou 'rgb(r,g,b)'.
   *
   * @param string $string La chaîne à vérifier
   * @return array Retourne la représentation RGB de la couleur
   * si c'est une couleur valide, sinon un tableau vide
   */
  isValidRgb(string: string) {
    const matches = string.match(
      '/^(?:rgb)?((0|[1-9]d{0,2}),s?(0|[1-9]d{0,2}),s?(0|[1-9]d{0,2}))$/i',
    );
    if (matches) {
      const red = +Number(matches[1]).toFixed();
      const green = +Number(matches[2]).toFixed();
      const blue = +Number(matches[3]).toFixed();

      if (
        red >= 0 &&
        red <= 255 &&
        green >= 0 &&
        green <= 255 &&
        blue >= 0 &&
        blue <= 255
      ) {
        return [red, green, blue];
      }
    }

    return [];
  }

  /**
   * Analyse une couleur à partir d'une chaîne de caractères
   * et la convertie en représentation hexadécimale.
   *
   * @throws \InvalidArgumentException
   * @param string $string La chaîne à analyser
   * @return array
   *  array[hex]  Représentation hexadécimale de la couleur
   *  array[type] Type de format (hex, rgb, named)
   */
  parse(string: string) {
    // Vérification nom d'une couleur
    if (this.names[string.toLowerCase()])
      return {
        hex: this.names[string.toLowerCase()],
        type: 'named',
      };

    // Vérification hexadécimale
    const hexString = this.prependHashIfNecessary(string);
    if (this.isValidHex(hexString))
      return {
        hex: this.normalizeHex(hexString),
        type: 'hex',
      };

    // Vérification RGB
    const rgb = this.isValidRgb(string);
    if (rgb.length > 0)
      return {
        hex: this.rgbhex(rgb),
        type: 'rgb',
      };
    /**
     * / TODO create Exceptions
     */
    // throw new InvalidArgumentException(trans("validation.color", [
    //     '%attribute%' => $string
    // ]));
  }

  /**
   * Retourne le meilleur contraste par rapport à une couleur.
   *
   * @param string $string La couleur à vérifier
   * @param integer $default
   * @return string
   */
  contrast(string: string, num = -15) {
    const output = this.parse(string);
    const hexcolor = output['hex'];
    const index = this.colors.findIndex((color) => color === hexcolor);
    if (index !== -1) {
      return this.colors[this.fontColors[index]];
    }

    return this.colors[num];
  }

  /**
   * Ajoute le caractère 0 en début de chaine s'il n'y a qu'un caractère.
   *
   * @param  string $string La chaine à vérifier.
   * @return string Retourne la chaine, précédée du caractère 0 si nécessaire.
   */
  prependZeroIfNecessary(string: string) {
    return string.length === 1 ? '0' + string : string;
  }

  /**
   * Ajoute le caractère # en début de chaine s'il n'existe pas.
   *
   * @param string $string La chaine à vérifier
   * @return string Retourne la chaine précédée du caractère #
   */
  prependHashIfNecessary(string: string) {
    if (!string.length) {
      return string;
    }
    return string[0] === '#' ? string : `#${string}`;
  }
}

export const colorHelper = new ColorHelper();
