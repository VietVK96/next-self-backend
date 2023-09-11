import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStringOrNull(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'isStringOrNull',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            typeof value === 'string' || value === null || value === undefined
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a string or null.`;
        },
      },
    });
  };
}

export function MaxLengthOrNull(
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'maxLengthOrNull',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [max],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [max] = args.constraints;
          return (
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.length <= max)
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [max] = args.constraints;
          return `${args.property} must be a string with a maximum length of ${max} or null.`;
        },
      },
    });
  };
}
