/**
 * ArrayUtil.php
 */

import { CaseType } from 'src/constants/util';

/**
 * Vérifie si un tableau est associatif (array("parent" => "John", "child" => "Louis"))
 * ou séquentiel (array(0 => "John", 1 => "Louis")).
 *
 * @param array $array le tableau à vérifier
 * @return bool
 */
export function isAssociative(array: Record<string, any>): boolean {
  return Object.keys(array).some((key) => isNaN(Number(key)));
}

/**
 * Transforme un tableau associatif (array("parent" => "John", "child" => "Louis"))
 * en séquentiel (array(0 => array("parent" => "John", "child" => "Louis"))).
 *
 * @param array $array le tableau associatif à trasnformer
 * @return array le tableau transformé
 */
export function associatifToSequential(array: Record<string, any>): any[] {
  if (Object.keys(array).length === 0) {
    return [];
  }
  if (!isAssociative(array)) {
    return [array];
  }

  return [array];
}

/**
 * Modifie les clés du tableau array et force leur casse.
 * Cette fonction se reproduira dans toutes les profondeurs du tableau.
 * Cette fonction laissera les clés numériques inchangées.
 *
 * @param array $array le tableau à traiter
 * @param int $case soit CASE_UPPER (majuscules), soit CASE_LOWER (minuscules, valeur par défaut)
 * @return array retour un tableau dont les clés ont été transformées en majuscule ou en minuscule
 */
export function changeKeyCaseRecursive(
  array: Record<string, any>,
  caseType: number | CaseType,
): Record<string, any> {
  const transformedArray: Record<string, any> = {};
  for (const key in array) {
    if (Object.prototype.hasOwnProperty.call(array, key)) {
      const transformedKey =
        caseType === CaseType.CASE_UPPER
          ? key.toUpperCase()
          : key.toLowerCase();
      if (typeof array[key] === 'object' && array[key] !== null) {
        transformedArray[transformedKey] = changeKeyCaseRecursive(
          array[key],
          caseType,
        );
      } else {
        transformedArray[transformedKey] = array[key];
      }
    }
  }

  return transformedArray;
}

/**
 * Combine plusieurs tableaux ensemble, récursivement.
 * Contrairement à la fonction array_merge_recursive de PHP, si deux tableaux
 * ont la même clé non numérique, la dernière valeur écrasera la précédente.
 *
 * @param {...Record<string, any>} arrays liste variable de tableaux à rassembler récursivement
 * @return Record<string, any> un tableau de valeurs résultantes de la fusion des arguments
 */
export function mergeRecursive(
  ...arrays: Record<string, any>[]
): Record<string, any> {
  const merged: Record<string, any> = {};
  for (const array of arrays) {
    for (const key in array) {
      if (Object.prototype.hasOwnProperty.call(array, key)) {
        const value = array[key];

        // Si la valeur est un tableau et la clé existe dans le tableau fusionné,
        // alors on effectue une récursion.
        if (
          typeof value === 'object' &&
          value !== null &&
          typeof merged[key] === 'object' &&
          merged[key] !== null
        ) {
          merged[key] = mergeRecursive(merged[key], value);
        } else {
          // Si la clé est numérique, la valeur est insérée dans le tableau.
          // Sinon, on remplace la valeur du tableau fusionné.
          if (isNaN(Number(key))) {
            merged[key] = value;
          } else {
            merged.push(value);
          }
        }
      }
    }
  }

  return merged;
}

/**
 * Divise une collection ([1, 2, 3, 4, 5]) en ensembles ([0 => [2, 4], 1 => [1, 3, 5]]),
 * regroupés par le résultat de l'exécution de la fonction d'itération ($n % 2)
 * sur chaque valeur de la collection.
 *
 * @param array array la collection à traiter
 * @param string|function iterator la fonction d'itération
 * @return Record<string, any[]> le tableau d'ensembles
 */
export function groupBy(
  array: any[],
  iterator: ((value: any, index: number) => string) | string,
): Record<string, any[]> {
  const result: Record<string, any[]> = {};
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    const key =
      typeof iterator === 'function' ? iterator(value, i) : value[iterator];
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(value);
  }

  return result;
}

/**
 * Retourne un tableau de toutes les valeurs qui contiennent
 * les paires clé / valeur dans la liste des propriétés.
 *
 * @param array array le tableau d'objets
 * @param Record<string, any> properties la liste des propriétés
 * @return any[]
 */
export function where(
  array: Record<string, any>[],
  properties: Record<string, any>,
): any[] {
  return array.filter((e) => {
    let count = 0;
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        const value = properties[key];
        if (value === e[key]) {
          count++;
        }
      }
    }

    return count === Object.keys(properties).length;
  });
}

/**
 * Retourne la première valeur qui correspond à toutes les paires
 * clé / valeur dans la liste des propriétés.
 *
 * @param array array le tableau d'objets
 * @param Record<string, any> properties la liste des propriétés
 * @return any|null
 */
export function findWhere(
  array: Record<string, any>[],
  properties: Record<string, any>,
): any | null {
  const result = where(array, properties);
  const values = Object.values(result);
  if (values !== undefined) return values.length > 0 ? values[0] : null;
}

/**
 * Aplatit un tableau imbriqué (l'imbrication peut être à n'importe quelle profondeur).
 *
 * @param array array le tableau imbriqué
 * @return any[] le tableau aplatit
 */
export function flatten(array: any[]): any[] {
  const iterator = new RecursiveArrayIterator(array);
  const flattened: any[] = [];
  for (const value of iterator) {
    flattened.push(value);
  }

  return flattened;
}

export class RecursiveArrayIterator implements Iterable<any> {
  private readonly data: any[];
  constructor(data: any[]) {
    this.data = data;
  }
  *[Symbol.iterator](): Iterator<any> {
    for (const value of this.data) {
      if (Array.isArray(value)) {
        const nestedIterator = new RecursiveArrayIterator(value);
        yield* nestedIterator;
      } else {
        yield value;
      }
    }
  }
}

/**
 * Renvoie true si chaque valeur de la collection réussit le test de rappel de vérité.
 * Les arguments de rappel seront l'élément, l'index et la collection.
 *
 * @param iterable collection la collection à vérifier
 * @param (element: any, index: number, collection: Iterable<any>) => boolean callback
 *     hàm kiểm tra cho trước sẽ nhận các đối số phần tử, chỉ mục và bộ sưu tập
 * @return boolean true nếu mỗi giá trị thỏa mãn hàm kiểm tra, ngược lại false
 */
export function every(
  collection: Iterable<any>,
  callback: (element: any, index: number, collection: Iterable<any>) => boolean,
): boolean {
  let index = 0;
  for (const element of collection) {
    if (!callback(element, index, collection)) {
      return false;
    }
    index++;
  }

  return true;
}
