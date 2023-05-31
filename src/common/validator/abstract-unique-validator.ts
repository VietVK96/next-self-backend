import {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  Connection,
  EntitySchema,
  FindOptionsWhere,
  ObjectType,
} from 'typeorm';

interface UniqueValidationArguments<E> extends ValidationArguments {
  constraints: [
    ObjectType<E> | EntitySchema<E> | string,
    (
      | ((validationArguments: ValidationArguments) => FindOptionsWhere<E>)
      | keyof E
    ),
  ];
}

export abstract class UniqueValidator implements ValidatorConstraintInterface {
  protected constructor(protected readonly connection: Connection) {}

  public async validate<E>(value: string, args: UniqueValidationArguments<E>) {
    const [EntityClass, findCondition = args.property] = args.constraints;
    const repo = this.connection.getRepository(EntityClass);
    if (typeof findCondition === 'function') {
      return (
        (await repo.count({
          where: findCondition(args) as
            | FindOptionsWhere<E>
            | FindOptionsWhere<E>[],
        })) <= 0
      );
    } else {
      const s: keyof E = findCondition as keyof E;
      const where: FindOptionsWhere<E> = {
        [s]: value,
      } as FindOptionsWhere<E>;
      return (
        (await repo.count({
          where,
        })) <= 0
      );
    }
  }

  public defaultMessage(args: ValidationArguments) {
    const [EntityClass] = args.constraints;
    const entity = EntityClass.name || 'Entity';
    return `${entity} with the same '${args.property}' already exist`;
  }
}
