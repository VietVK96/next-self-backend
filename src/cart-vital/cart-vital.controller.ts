import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import {
  ReadCardVitalDto,
  SaveCardVitalDto,
  SyncFsvDto,
  UpdateFSVDto,
} from './dto/cart-vital.dto';
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

  //php/sesam-vitale/patient/synchronize.php
  // all line
  @Post('/sync-fsv')
  @UseGuards(TokenGuard)
  @ApiProperty({
    description: 'sync fsv',
  })
  async fsvSynchronize(@Body() payload: SyncFsvDto) {
    return await this.cartVitalService.syncFsv(payload);
  }

  //php/sesam-vitale/patient/updateFrom.php
  //all line
  @Post('/update-fsv')
  @UseGuards(TokenGuard)
  @ApiProperty({
    description: 'update fsv',
  })
  async updateFSV(
    @CurrentUser() identity: UserIdentity,
    @Body() payload: UpdateFSVDto,
  ) {
    return await this.cartVitalService.updateFrom(payload, identity?.org);
  }
}
