import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MemoService } from './services/memo.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUpdateMemoDto } from './dto/createUpdate.memo.dto';
import { MemoRes } from './response/memo.res';
import { TokenGuard } from 'src/common/decorator/auth.decorator';

@Controller('memo')
@ApiBearerAuth()
@ApiTags('Memo')
export class MemoController {
  constructor(private readonly memoService: MemoService) {}

  //ecoodentist-1.31.0\php\memo\store.php
  @Post('save')
  @UseGuards(TokenGuard)
  async create(@Body() payload: CreateUpdateMemoDto) {
    return this.memoService.create(payload);
  }

  //ecoodentist-1.31.0\php\memo\show.php
  @Get('show/:id')
  @UseGuards(TokenGuard)
  async show(@Param('id') id: number) {
    return this.memoService.show(id);
  }

  //ecoodentist-1.31.0\php\memo\delete.php
  @Delete('delete/:id')
  @UseGuards(TokenGuard)
  async delete(@Param('id') id: number) {
    return this.memoService.delete(id);
  }

  //ecoodentist-1.31.0\php\memo\update.php
  @Post('update/:id')
  @UseGuards(TokenGuard)
  async update(@Param('id') id: number, @Body() payload: MemoRes) {
    return this.memoService.update(id, payload);
  }
}
