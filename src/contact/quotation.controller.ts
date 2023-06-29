import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { QuotationService } from './services/quotation.service';
import { EventTaskDto } from './dto/task.contact.dto';
import { SuccessResponse } from 'src/common/response/success.res';

@ApiBearerAuth()
@Controller('/dental')
@ApiTags('Quotation')
export class QuotationController {
  constructor(private quotationService: QuotationService) {}

  /**
   * php/dental/quotation/delete.php -> full file
   * delete quotation
   */
  @Delete('/quotation/:id')
  @UseGuards(TokenGuard)
  async deleteNote(
    @CurrentUser() identity: UserIdentity,
    @Param('id') id: number,
  ): Promise<any> {
    return await this.quotationService.deleteQuotation(identity, id);
  }
}
