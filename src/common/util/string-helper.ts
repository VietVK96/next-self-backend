import { v4 as uuidv4 } from 'uuid';
import { enc, MD5, SHA1 } from 'crypto-js';

/**
 * application\Helpers\StringHelper.php
 */
export class StringHelper {
  /**
   * Remplace tous les caractères accentués par leurs équivalents.
   *
   * @param string $string La chaîne de caractères à remplacer.
   * @return string Retourne la chaîne de caractères valide.
   */
  public static stripAccents(string: string): string {
    return string.replace(
      /À|Á|Â|Ã|Ä|Å|Æ|Ç|È|É|Ê|Ë|Ì|Í|Î|Ï|Ð|Ñ|Ò|Ó|Ô|Õ|Ö|Ø|Ù|Ú|Û|Ü|Ý|ß|à|á|â|ã|ä|å|æ|ç|è|é|ê|ë|ì|í|î|ï|ñ|ò|ó|ô|õ|ö|ø|ù|ú|û|ü|ý|ÿ|Ā|ā|Ă|ă|Ą|ą|Ć|ć|Ĉ|ĉ|Ċ|ċ|Č|č|Ď|ď|Đ|đ|Ē|ē|Ĕ|ĕ|Ė|ė|Ę|ę|Ě|ě|Ĝ|ĝ|Ğ|ğ|Ġ|ġ|Ģ|ģ|Ĥ|ĥ|Ħ|ħ|Ĩ|ĩ|Ī|ī|Ĭ|ĭ|Į|į|İ|ı|Ĳ|ĳ|Ĵ|ĵ|Ķ|ķ|Ĺ|ĺ|Ļ|ļ|Ľ|ľ|Ŀ|ŀ|Ł|ł|Ń|ń|Ņ|ņ|Ň|ň|ŉ|Ō|ō|Ŏ|ŏ|Ő|ő|Œ|œ|Ŕ|ŕ|Ŗ|ŗ|Ř|ř|Ś|ś|Ŝ|ŝ|Ş|ş|Š|š|Ţ|ţ|Ť|ť|Ŧ|ŧ|Ũ|ũ|Ū|ū|Ŭ|ŭ|Ů|ů|Ű|ű|Ų|ų|Ŵ|ŵ|Ŷ|ŷ|Ÿ|Ź|ź|Ż|ż|Ž|ž|ſ|ƒ|Ơ|ơ|Ư|ư|Ǎ|ǎ|Ǐ|ǐ|Ǒ|ǒ|Ǔ|ǔ|Ǖ|ǖ|Ǘ|ǘ|Ǚ|ǚ|Ǜ|ǜ|Ǻ|ǻ|Ǽ|ǽ|Ǿ|ǿ/g,
      (matched: string) => String.fromCharCode(matched.charCodeAt(0) & 0x7f),
    );
  }

  /**
   * Découpe une chaîne de caractères en plusieurs sous-chaînes de $length caractères,
   * en conservant les mots entiers.
   * Le caractère $character n'est pas conservé entre 2 lignes.
   * Les retours chariots sont considérés comme des caractères de découpage.
   *
   * @param  string $string La chaîne de caractères à découper.
   * @param  integer $length Taille des lignes.
   * @param  string $character Caractère de découpe.
   * @return array Retourne les sous-chaînes.
   */
  public static trunkLine(
    string: string,
    length?: number,
    character?: string,
  ): string[] {
    if (!length) length = 76;
    if (!character) character = ' ';
    if (string.indexOf('\n') !== -1) {
      const ar_strings = string.split('\n');
      let array_reste: string[] = [];
      for (const line of ar_strings) {
        array_reste = array_reste.concat(
          StringHelper.trunkLine(line, length, character),
        );
      }
      return array_reste;
    } else {
      if (length >= string.length) {
        return [string];
      }
      let first_line = string.substring(0, length + 1);
      const pos_last_space = first_line.lastIndexOf(character);
      if (pos_last_space === -1) {
        first_line = first_line.substring(0, length);
      } else {
        first_line = first_line.substring(0, pos_last_space);
      }
      const rest_string = string.substring(pos_last_space + 1);

      const array_reste = StringHelper.trunkLine(
        rest_string,
        length,
        character,
      );
      array_reste.unshift(first_line);
      return array_reste;
    }
  }

  /**
   * Génère une chaine de caractères aléatoire.
   *
   * @param  string $format Format de la chaine de caractères (alnumn, hex, alpha, numeric, md5, sha1, guid).
   * @param  integer $length Taille de la chaîne de caractères.
   * @return string Retourne la chaine de caractères aléatoires.
   */
  public static random(format: string, length: number): string {
    if (!format) format = 'alnum';
    if (!length) length = 16;
    format = format.toLowerCase();

    // Formatage GUID.
    if (format === 'guid') {
      return uuidv4();
    }
    // Liste des caractères acceptés.
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    if (format === 'hex') {
      characters = 'abcdef0123456789';
    } else if (format === 'alpha') {
      characters = 'abcdefghijklmnopqrstuvwxyz';
    } else if (format === 'numeric') {
      characters = '0123456789';
    }
    // Calcul de la chaine de caractères aléatoires.
    let random = '';
    for (let i = 0; i < length; i++) {
      random += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    // Formatage MD5 ou SHA1.
    if (format === 'md5') {
      return MD5(random).toString(enc.Hex);
    } else if (format === 'sha1') {
      return SHA1(random).toString(enc.Hex);
    }
    return random;
  }

  /**
   * Retourne string après avoir remplacé les balises <br>, <br/> ou <br />
   * par une nouvelle ligne (PHP_EOL par defaut).
   *
   * @param  string $string La chaîne de caractères à découper.
   * @param  string $replace Caractère de remplacement
   * @return string Retourne la chaîne modifiée.
   */
  public static br2nl(string: string, replace: string): string {
    if (!replace) replace = '\n';
    return string.replace(/<br(\s*)\/?>/gi, replace);
  }

  /**
   * Conversion des octets en chaine de caractères.
   *
   * @param  integer $bytes Octets à convertir.
   * @param  integer $format Format de conversion (KB,MB,GB,TB,PB,EB,ZB,YB) ou FALSE.
   * @return string Retourne la chaîne de caractères représentant les octets.
   */

  public static formatBytes(bytes: number, format: string | false): string {
    const formats = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const size = 1024;
    bytes /= size;
    let i = 0;

    if (format && !formats.includes(format)) {
      while (bytes > size) {
        bytes /= size;
        i++;
      }
    } else if (format && formats.includes(format)) {
      const key = formats.indexOf(format);
      while (i < key) {
        bytes /= size;
        i++;
      }
    }
    return `${bytes.toFixed(2)} ${formats[i]}`;
  }

  /**
   * Retourne le numéro de sécurité social formatté X XX XX XX XXX XXX XX.
   *
   * @param  string $string Numéro de sécurité social.
   * @return string
   */
  public static formatInsee(string: string): string {
    string = string.replace(/\W/g, '').toUpperCase();
    return string.replace(
      /(\w{1})(\w{2})(\w{2})(\w{2})(\w{3})(\w{3})(\w{2})/,
      '$1 $2 $3 $4 $5 $6 $7',
    );
  }

  /**
   * Vérifie si un texte commence par une chaîne donnée.
   *
   * @param string $haystack La chaîne dans laquelle on doit chercher
   * @param mixed $needle La chaîne à chercher
   * @return boolean
   */
  public static startsWith(haystack: string, needle: string): boolean {
    return haystack.startsWith(needle);
  }

  /**
   * Vérifie si un texte se termine par une chaîne donnée.
   *
   * @param string $haystack La chaîne dans laquelle on doit chercher
   * @param mixed $needle La chaîne à chercher
   * @return boolean
   */
  public static endsWith(haystack: string, needle: string): boolean {
    return haystack.endsWith(needle);
  }
}

/**
 * This function is same as PHP's nl2br() with default parameters.
 *
 * @param {string} str Input text
 * @param {boolean} replaceMode Use replace instead of insert
 * @param {boolean} isXhtml Use XHTML
 * @return {string} Filtered text
 */
