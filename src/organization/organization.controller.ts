import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganizationService } from './service/organization.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { OrganizationSubscriptionService } from './service/organizationSubscription.service';
import { SubscriptionsPlanUpdateDto } from './dto/organization.dto';
import { ErrorCode } from 'src/constants/error';

@ApiTags('Organization')
@Controller('organization')
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private organizationService: OrganizationService,
    private readonly organizationSubscriptionService: OrganizationSubscriptionService,
  ) {}

  /**
   * php/organizations/about.php -> full
   *
   */
  @Get('/about')
  @UseGuards(TokenGuard)
  async about(@CurrentUser() identity: UserIdentity) {
    try {
      return await this.organizationService.about(identity);
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  //settings/organizations/edit.php
  //all line
  @Get()
  @UseGuards(TokenGuard)
  async getCurrentOrganization(@CurrentUser() identity: UserIdentity) {
    try {
      return await this.organizationService.getCurrentOrganization(
        identity.org,
      );
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Additional api to optimize performance
   */

  @Get('settings')
  @UseGuards(TokenGuard)
  async getSettingsObservation(@CurrentUser() identity: UserIdentity) {
    return await this.organizationService.getSettingsObservation(identity.org);
  }

  /**
   * fsd/organizations/subscriptions/edit.php
   * @param organization_id
   */
  @Get('subscriptions/edit')
  @UseGuards(TokenGuard)
  async findAllPlan(@Query('organization_id') organization_id: number) {
    return this.organizationSubscriptionService.findAllPlan(organization_id);
  }

  /**
   * fsd/organizations/subscriptions/update.php
   */
  @Put('subscriptions/update')
  @UseGuards(TokenGuard)
  async updateSubscriptionsPlan(
    @Query('organization_id') organization_id: number,
    @Body() payload?: SubscriptionsPlanUpdateDto,
  ) {
    return this.organizationSubscriptionService.updatePlanSubscriptions(
      organization_id,
      payload,
    );
  }
}
