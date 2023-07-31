//File application/Utils/DentalLocalizationUtil.php

const MOUTH_NUMBER = '00';
const MOUTH_TEETH = [
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
];
const MAXILLARY_NUMBER = '01';
const MAXILLARY_TEETH = [
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
];
const MAXILLARY_ADULT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];
const MANDIBULAR_NUMBER = '02';
const MANDIBULAR_TEETH = [
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
];
const MANDIBULAR_ADULT_TEETH = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

const isEveryMaxillary = (numbers: string[]): boolean => {
  return numbers.every((number) => MAXILLARY_TEETH.includes(number));
};
const isPartOfMaxillary = (toothNumber: string): boolean => {
  return MAXILLARY_TEETH.includes(toothNumber);
};

const isEveryMandibular = (numbers: string[]): boolean => {
  return numbers.every((number) => MANDIBULAR_TEETH.includes(number));
};

const isPartOfMandibular = (toothNumber: string): boolean => {
  return MANDIBULAR_TEETH.includes(toothNumber);
};

export const dentalFormat = (numbers): string => {
  if (numbers?.length === 0) {
    return '';
  } else if (numbers?.length === 0) {
    return numbers[0];
  } else if (isEveryMaxillary(numbers)) {
    return MAXILLARY_NUMBER;
  } else if (isEveryMandibular(numbers)) {
    return MANDIBULAR_NUMBER;
  } else {
    return [MAXILLARY_NUMBER, MANDIBULAR_NUMBER].join(',');
  }
};
