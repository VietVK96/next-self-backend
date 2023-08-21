import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import {
  CurrentUser,
  TokenGuard,
  UserIdentity,
} from 'src/common/decorator/auth.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Feedback')
@Controller('feedback')
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // File: php/feedback.php 100%
  @Post()
  @UseGuards(TokenGuard)
  create(
    @Body() createFeedbackDto: CreateFeedbackDto,
    @CurrentUser() user: UserIdentity,
    @Req() req: Request,
  ) {
    return this.feedbackService.sendFeedback(
      createFeedbackDto,
      user,
      req.headers['user-agent'] ?? '',
    );
  }
}
