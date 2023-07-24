import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalDeviceDto {
  @ApiProperty()
  name: string;
}
