import { ApiProperty } from '@nestjs/swagger';
import { TraceabilitiesItemDto } from '../dto/index.dto';

export class TraceabilitiesResponse {
  @ApiProperty()
  current_page_number?: number;

  @ApiProperty()
  num_items_per_page?: number;

  @ApiProperty()
  custom_parameters?: { sorted: boolean };

  @ApiProperty()
  items?: TraceabilitiesItemDto[];

  @ApiProperty()
  total_count?: number;

  @ApiProperty()
  paginator_options?: {
    defaultSortDirection: string;
    defaultSortFieldName: string;
    distinct: boolean;
    filterFieldParameterName: string;
    filterValueParameterName: string;
    pageParameterName: string;
    sortDirectionParameterName: string;
    sortFieldParameterName: string;
  };
}
