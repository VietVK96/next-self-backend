import { ApiProperty } from '@nestjs/swagger';

export class EventTypeColorDto {
  @ApiProperty()
  background?: string;

  @ApiProperty({
    default: '#ffffff',
  })
  foreground?: string;
}

export class CreateEventTypeDto {
  @ApiProperty()
  label?: string;

  @ApiProperty()
  duration?: string;

  @ApiProperty()
  color?: EventTypeColorDto;
}

export class DuplicateEventTypeDto {
  @ApiProperty()
  practitioners?: number[];

  @ApiProperty()
  delete_all?: boolean;
}

export class UpdateEventTypeDto {
  @ApiProperty()
  label?: string;

  @ApiProperty()
  duration?: string;

  @ApiProperty()
  color?: EventTypeColorDto;

  @ApiProperty()
  isVisible?: number;
}
