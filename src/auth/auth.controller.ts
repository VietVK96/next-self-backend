import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuccessResponse } from 'src/common/response/success.res';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ValidationDto } from './dto/validation.dto';
import { LoginRes } from './reponse/token.res';
import { SessionService } from './services/session.service';
import { ValidationService } from './services/validation.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private validationService: ValidationService,
    private sessionService: SessionService,
  ) {}

  /**
   * File: auth\validation.php
   */
  @Post('validation')
  async validation(@Body() payload: ValidationDto) {
    return await this.validationService.validation(payload);
  }

  @Post('refresh')
  @ApiOperation({
    description: 'Refresh new token',
  })
  async loginWithUser(@Body() payload: RefreshTokenDto): Promise<LoginRes> {
    return await this.sessionService.refreshToken(payload);
  }

  @Delete('logout')
  @ApiOperation({
    description: 'Logout token',
  })
  async logout(@Body() payload: LogoutDto): Promise<SuccessResponse> {
    await this.sessionService.deleteToken(payload);
    return {
      success: true,
    };
  }
}
