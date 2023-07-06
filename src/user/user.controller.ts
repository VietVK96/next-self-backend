import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from 'src/common/decorator/auth.decorator';
import { UserService } from './services/user.service';
import { UpdateTherapeuticDto } from './dto/therapeutic.dto';

@ApiBearerAuth()
@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * php\contact\prestation\findAll.php 1->14
   * @param payload
   * @param identity
   * @returns
   */

  @Post('/therapeutic-alternatives/update/:id')
  // @UseGuards(TokenGuard)
  async updatePrestation(
    @Param('id') id: number,
    @Body() payload: UpdateTherapeuticDto,
  ) {
    return await this.userService.updateUserMedical(id, payload);
  }
}
