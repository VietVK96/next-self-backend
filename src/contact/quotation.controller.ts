import { Controller, Delete, Param, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { QuotationService } from './services/quotation.service';
import { PreferenceQuotationDto } from './dto/quotation.dto';

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

  /**
   * /php/user/preference/quotation/patch.php -> full file
   * patch preference quotation
   */
  @Patch('/preference/quotation/:id')
  @UseGuards(TokenGuard)
  async patchPreferenceQuotation(
    @CurrentUser() identity: UserIdentity,
    @Param('payload') payload: PreferenceQuotationDto,
    @Param('id') id: number,
  ): Promise<any> {
    return await this.quotationService.patchPreferenceQuotation(
      id,
      identity,
      payload,
    );
  }
}
