/**
 * DateTimeUtil.php
 */

/**
 * Transforme une période de temps en nombre de minutes (eg. 06:30:00 retourne 390).
 *
 * @param time string la période de temps au format "HH:MM:SS"
 * @return number le nombre de minutes
 * @throws Error si le format de la période de temps n'est pas valide
 */
export function timeToMinutes(time: string): number {
  const regex =
    /^(?<hours>[0-1][0-9]|[2][0-3]):(?<minutes>[0-5][0-9])(:(?<seconds>[0-5][0-9]))?$/;
  const matches = time.match(regex);
  if (!matches) {
    throw new Error('Format de la période de temps non valide');
  }
  const hours = parseInt(matches.groups?.hours || '0', 10);
  const minutes = parseInt(matches.groups?.minutes || '0', 10);

  return hours * 60 + minutes;
}

/**
 * Transforme un nombre de minutes en période de temps (eq. 390 retourn 06:30:00).
 *
 * @param minutes number le nombre de minutes
 * @return string la période de temps au format "HH:MM:SS"
 */
export function minutesToTime(minutes: number): string {
  minutes = Math.abs(minutes);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(
    2,
    '0',
  )}:00`;
}

/**
 * Modifie l'objet Date gốc en le mettant au début de l'unité de temps.
 *
 * year : 1er Janvier de l'année, minuit
 * month : 1er jour du mois, minuit
 * week : 1er jour de la semaine, minuit
 * day : aujourd'hui, minuit
 * hour : aujourd'hui, 0 minutes, 0 secondes
 * minute : aujourd'hui, 0 minutes
 * second : aujourd'hui
 *
 * @param datetime Date l'objet Date gốc
 * @param unit string unité de temps
 */
export function startOf(datetime: Date, unit: string = 'month'): void {
  switch (unit) {
    // 1er janvier de l'année, minuit
    case 'year':
      datetime.setFullYear(datetime.getFullYear(), 0, 1);
      datetime.setHours(0, 0, 0, 0);
      break;
    // 1er jour du mois, minuit
    case 'month':
      datetime.setDate(1);
      datetime.setHours(0, 0, 0, 0);
      break;
    // 1er jour de la semaine, minuit (lundi)
    case 'week':
      datetime.setDate(datetime.getDate() - datetime.getDay() + 1);
      datetime.setHours(0, 0, 0, 0);
      break;
    // aujourd'hui, minuit
    case 'day':
      datetime.setHours(0, 0, 0, 0);
      break;
    // aujourd'hui, 0 minute, 0 seconde
    case 'hour':
      datetime.setMinutes(0, 0, 0);
      break;
    // aujourd'hui, 0 seconde
    case 'minute':
      datetime.setSeconds(0, 0);
      break;
    // aujourd'hui
    case 'second':
      datetime.setMilliseconds(0);
      break;
  }
}
