import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ReadCardVitalDto, SaveCardVitalDto } from './dto/cart-vital.dto';
import { CartVitalService } from './services/cart-vital.service';

@Controller('/cart-vital')
@ApiTags('CartVital')
@ApiBearerAuth()
export class CartVitalController {
  constructor(private cartVitalService: CartVitalService) {}

  //php/interfacage/vitaleCardReading.php
  //all line
  @Get()
  @UseGuards(TokenGuard)
  @ApiProperty({
    description: 'Read Cart vital',
  })
  async readCartVital(@Query() payload: ReadCardVitalDto) {
    return await this.cartVitalService.readCartVital(payload);
  }

  //php/interfacage/vitaleCardSave.php
  //all line
  @Post()
  @UseGuards(TokenGuard)
  @ApiProperty({
    description: 'Save Cart vital',
  })
  async saveCartVital(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: SaveCardVitalDto,
  ) {
    return await this.cartVitalService.saveCartVital(payload, identity);
  }
}