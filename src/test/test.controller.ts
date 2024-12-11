import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TestService } from './service/test.service';

@ApiTags('Test')
@Controller('test')
@ApiBearerAuth()
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get('validation')
  async validation() {
    return await this.testService.test();
  }
}
