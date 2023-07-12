import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { UserService } from './services/user.service';
import {
  UpdatePreferenceDto,
  UpdateTherapeuticDto,
  UpdateTherapeuticParamDto,
} from './dto/therapeutic.dto';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { PreferenceService } from './services/preference.sevece';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(
    private userService: UserService,
    private preferenceService: PreferenceService,
  ) {}

  /**
   * php\contact\prestation\findAll.php 1->14
   * @param payload
   * @param identity
   * @returns
   */

  @Post('/therapeutic-alternatives/update')
  @UseGuards(TokenGuard)
  async updatePrestation(
    @Query() param: UpdateTherapeuticParamDto,
    @Body() payload: UpdateTherapeuticDto,
  ) {
    return await this.userService.updateUserMedical(param.user_id, payload);
  }

  @Get('/find')
  @UseGuards(TokenGuard)
  async findUserById(@Query('id') id: number) {
    if (!Number(id)) throw new CBadRequestException('id must be a number');
    return await this.userService.find(id);
  }

  @Post('preference/patch')
  @UseGuards(TokenGuard)
  async updatePreference(@Body() payload: UpdatePreferenceDto) {
    return await this.preferenceService.pacth(payload);
  }

  @Get('/therapeutic-alternatives')
  @UseGuards(TokenGuard)
  async getPrestation(@Query() param: UpdateTherapeuticParamDto) {
    return await this.userService.getTherapeutic(param.user_id);
  }
}
