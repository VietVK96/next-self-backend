import { Body, Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { HaliteEncryptorHelper } from 'src/common/lib/halite/encryptor.helper';
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
    private configService: ConfigService,
  ) {}

  /**
   * File: auth\validation.php
   */
  @Post('validation')
  async validation(@Body() payload: ValidationDto, @Req() request: Request) {
    return await this.validationService.validation(payload, request);
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

  /**
   *
   * Test function for encrypt and decrypt in database of php
   */
  @Get('test-encrypt')
  async test() {
    const key = this.configService.get<string>('app.haliteKey');
    const input = {
      inputEnc:
        'MUIEAH6CaPA9ZnvK92RJVf8pn_OfXpIza_D3jpI5AQA8tReBgjbzY3leMXHNRvHLPQM58VMFkOEgk7XoLZSo_2-z5pG39rmzdD_7_Nl1NejfiUqTYdGWUpjFyq3h8yGlUPs16lHqfxoikFcC_0zX9w0pVk1CSPNl432QXIjj7L3BUIjLgqdcByi4<ENC>',
      inputCheck: '23dae454bf4e7f',
    };
    const data = new HaliteEncryptorHelper(key);
    const v = data.decrypt(input.inputEnc);
    const x = data.decrypt(
      'MUIEADk/AuYxS+JBXAApxnodxhGP0xBScbq/i9EWm//iGMnHpteryDEqWjnN9wc8ZNHw/3dmWSXtpxBOZiW59Kx9GXIQlsKHvuzB/vj5u+unSFC7JMRiMp2JX30g1VYkRUnOuBbTATXs40gPau6FGI/rYwZEjbFtDyqgT+2FaBnLbJoQ/jrecVWc<ENC>',
    );
    const encode = data.encrypt(input.inputCheck);
    const decode = data.decrypt(encode);
    return {
      decode: {
        input: input.inputEnc,
        output: v,
        x,
      },
      encode: {
        input: input.inputCheck,
        output: encode,
        checked: decode === input.inputCheck,
      },
    };
  }
}
