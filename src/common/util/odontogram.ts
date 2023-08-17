/**
 * @var array Liste des dents par secteurs.
 */
const initSectors = {
  adult: {
    '00': [
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
    ],
    '01': [
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
    ],
    '02': [
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
      '38',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
    ],
    '10': ['11', '12', '13', '14', '15', '16', '17', '18'],
    '20': ['21', '22', '23', '24', '25', '26', '27', '28'],
    '30': ['31', '32', '33', '34', '35', '36', '37', '38'],
    '40': ['41', '42', '43', '44', '45', '46', '47', '48'],
    '03': ['14', '15', '16', '17', '18'],
    '04': ['11', '12', '13', '21', '22', '23'],
    '05': ['24', '25', '26', '27', '28'],
    '06': ['34', '35', '36', '37', '38'],
    '07': ['31', '32', '33', '41', '42', '43'],
    '08': ['44', '45', '46', '47', '48'],
  },
  child: {
    '00': [
      '51',
      '52',
      '53',
      '54',
      '55',
      '61',
      '62',
      '63',
      '64',
      '65',
      '71',
      '72',
      '73',
      '74',
      '75',
      '81',
      '82',
      '83',
      '84',
      '85',
    ],
    '01': ['51', '52', '53', '54', '55', '61', '62', '63', '64', '65'],
    '02': ['71', '72', '73', '74', '75', '81', '82', '83', '84', '85'],
    '10': ['51', '52', '53', '54', '55'],
    '20': ['61', '62', '63', '64', '65'],
    '30': ['71', '72', '73', '74', '75'],
    '40': ['81', '82', '83', '84', '85'],
    '03': ['54', '55'],
    '04': ['51', '52', '53', '61', '62', '63'],
    '05': ['64', '65'],
    '06': ['74', '75'],
    '07': ['71', '72', '73', '81', '82', '83'],
    '08': ['84', '85'],
  },
};

/**
 * Transformation de la liste des secteurs en liste de dents.
 * Retourne la liste des dents séparée par le caractère de séparation.
 *
 * @param  array|string $nums Liste des secteurs.
 * @param  string $separator Séparateur des dents (virgule par défaut).
 * @param  string $type Type de schéma (adult or child, adult par défaut).
 * @return string Liste des dents.
 */
export function changeSectorNumberToTooth(
  sectors: string[] | string,
  type = 'adult',
  separator = ',',
): string {
  sectors = Array.isArray(sectors) ? sectors : sectors.split(separator);
  const initSectorsInType =
    type === 'adult' ? initSectors?.adult : initSectors?.child;
  const res = sectors?.map((sector) => {
    return initSectorsInType?.[`${sector}`]?.join(',') ?? sector;
  });
  return res?.join(',');
}
