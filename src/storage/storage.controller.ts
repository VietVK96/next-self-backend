import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StorageService } from './services/storage.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { UpdateStoragePackDto, UsersStorageDto } from './dto/storage-pack.dto';
import { UsersStorageSpace } from './services/users-storage.service';

@ApiTags('Storage')
@Controller('storage')
@ApiBearerAuth()
export class StorageController {
  constructor(
    private storageService: StorageService,
    private usersStorageSpaceService: UsersStorageSpace,
  ) {}

  @Put('/pack')
  @UseGuards(TokenGuard)
  async updateStoragePack(
    @CurrentUser() identity: UserIdentity,
    @Body() body: UpdateStoragePackDto,
  ) {
    return this.storageService.updateStoragePack(
      identity.id,
      identity.org,
      body,
    );
  }

  @Get('/pack')
  @UseGuards(TokenGuard)
  async getStoragePack(@CurrentUser() identity: UserIdentity) {
    return this.storageService.getStoragePack(identity.org);
  }
  @Get('/users/storage')
  @UseGuards(TokenGuard)
  async getStorageSpaceManagement(@Query('group_id') groupId: number) {
    return this.usersStorageSpaceService.getStorageSpaceManagement(groupId);
  }

  @Put('/users/storage')
  @UseGuards(TokenGuard)
  async updateStorageSpaceManagement(
    @Query('group_id') groupId: number,
    @Body() payload: UsersStorageDto,
  ) {
    return this.usersStorageSpaceService.updateStorageSpaceManagement(
      groupId,
      payload,
    );
  }
}
