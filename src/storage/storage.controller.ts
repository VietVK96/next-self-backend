import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StorageService } from './services/storage.service';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { UpdateStoragePackDto } from './dto/storage-pack.dto';

@ApiTags('Storage')
@Controller('storage')
@ApiBearerAuth()
export class StorageController {
  constructor(private storageService: StorageService) {}

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
}
