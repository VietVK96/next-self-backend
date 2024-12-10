import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Bank')
@Controller('')
@ApiBearerAuth()
export class BankController {}
