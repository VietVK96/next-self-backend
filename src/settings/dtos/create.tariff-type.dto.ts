import { IsString } from 'class-validator';

export class CreateTariffTypeDto {
  @IsString()
  name?: string;
}
