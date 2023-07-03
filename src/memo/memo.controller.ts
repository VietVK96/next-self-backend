import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MemoService } from './services/memo.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUpdateMemoDto } from './dto/createUpdate.memo.dto';

@Controller('memo')
@ApiBearerAuth()
@ApiTags('Memo')
export class MemoController {
  constructor(private readonly memoService: MemoService) {}

  @Post('save')
  async create(@Body() payload: CreateUpdateMemoDto) {
    return this.memoService.create(payload);
  }

  @Get('show/:id')
  async show(@Param('id') id: number) {
    console.log(id);

    return this.memoService.show(id);
  }
}
