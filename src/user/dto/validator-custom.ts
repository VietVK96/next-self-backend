import { registerDecorator, ValidationOptions } from 'class-validator';
import { FindAllConditionsDto } from './list-of-treatments.dto';

const OPERATOR_SQL = ['between', 'gte', 'eq', 'lte', 'like'];
const FIELD_VALID = [
  'etk.date',
  'etk.name',
  'etk.amount',
  'det.teeth',
  'det.coef',
  'dlk.key',
  'det.code',
  'fse.nbr',
  'fse.date',
  'con.nbr',
  'con.lastname',
  'con.firstname',
];

export function IsSqlOperator(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isSqlOperator',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: FindAllConditionsDto[]) {
          if (value === null || value === undefined) return true;
          if (!Array.isArray(value)) return false;
          let result = true;
          value.forEach((i) => {
            if (
              typeof i.op !== 'string' ||
              !OPERATOR_SQL.includes(i.op) ||
              !FIELD_VALID.includes(i.field)
            )
              result = false;
          });
          return result;
        },
        defaultMessage() {
          return `op must be a operator of sql and or field is invalid`;
        },
      },
    });
  };
}
