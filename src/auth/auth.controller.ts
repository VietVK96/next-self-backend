import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ValidationDto } from './dto/validation.dto';
import { ValidationService } from './services/validation.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private validationService: ValidationService) {}

  /**
   * File: auth\validation.php
   */
  @Post('validation')
  async validation(@Body() payload: ValidationDto) {
    return await this.validationService.validation(payload);
  }
}
