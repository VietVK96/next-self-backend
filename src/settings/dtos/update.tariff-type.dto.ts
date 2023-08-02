import { IsString } from 'class-validator';

export class UpdateTariffTypeDto {
  @IsString()
  name?: string;
}
