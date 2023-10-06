import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CBadRequestException } from 'src/common/exceptions/bad-request.exception';
import { SuccessResponse } from 'src/common/response/success.res';
import { OrganizationSubscriptionEntity } from 'src/entities/organization-subcription.entity';
import { OrganizationEntity } from 'src/entities/organization.entity';
import { PlanEntity } from 'src/entities/plan.entity';
import { Repository } from 'typeorm';
import { SubscriptionsPlanUpdateDto } from '../dto/organization.dto';
import { ErrorCode } from 'src/constants/error';

@Injectable()
export class OrganizationSubscriptionService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly orgRepository: Repository<OrganizationEntity>,
    @InjectRepository(OrganizationSubscriptionEntity)
    private readonly orgSubsRepository: Repository<OrganizationSubscriptionEntity>,
  ) {}

  //File fsd/organizations/subscriptions/edit.php
  async findAllPlan(organization_id: number) {
    try {
      const allPlans = await this.planRepository.find();
      const organization = await this.orgRepository.findOneOrFail({
        where: { id: Number(organization_id) },
        select: {
          subscriptions: { planId: true },
        },
        relations: { subscriptions: true },
      });
      return {
        plans: allPlans,
        subscriptionPlans: organization.subscriptions,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
  //File fsd/organizations/subscriptions/update.php
  async updatePlanSubscriptions(
    organization_id: number,
    payload?: SubscriptionsPlanUpdateDto,
  ): Promise<SuccessResponse> {
    if (!payload) {
      return;
    }

    const organization = await this.orgRepository.findOneOrFail({
      where: { id: Number(organization_id) },
      relations: { subscriptions: true },
    });

    const planIdToUpdate = payload?.plans || [];

    try {
      const actualSubscriptions = organization.subscriptions;
      for (const subcription of actualSubscriptions) {
        if (!planIdToUpdate.includes(subcription.planId)) {
          await this.orgSubsRepository.remove(subcription);
        }
      }
      const now = new Date();
      const endPeriod = new Date('9999-12-31');
      const newSubscriptions = planIdToUpdate
        .filter(
          (id: number) => !actualSubscriptions.some((sub) => sub.planId === id),
        )
        .map((id: number) => ({
          organizationId: organization.id,
          planId: id,
          startOfPeriod: now.toISOString(),
          endOfPeriod: endPeriod.toISOString(),
          createdAt: now,
          updatedAt: now,
        }));

      await this.orgSubsRepository.save(newSubscriptions);
      return {
        success: true,
      };
    } catch (error) {
      throw new CBadRequestException(ErrorCode.STATUS_INTERNAL_SERVER_ERROR);
    }
  }
}
