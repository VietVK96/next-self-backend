import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { MemoService } from './services/memo.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUpdateMemoDto } from './dto/createUpdate.memo.dto';
import { MemoRes } from './response/memo.res';

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

  @Delete('delete/:id')
  async delete(@Param('id') id: number) {
    console.log(id);

    return this.memoService.delete(id);
  }

  @Post('update/:id')
  async update(@Param('id') id: number, @Body() payload: MemoRes) {
    return this.memoService.update(id, payload);
  }
}
