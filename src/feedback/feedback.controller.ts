import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
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

  @Post()
  @UseGuards(TokenGuard)
  create(
    @Request() request,
    @Body() createFeedbackDto: CreateFeedbackDto,
    @CurrentUser() user: UserIdentity,
  ) {
    return this.feedbackService.sendFeedback(createFeedbackDto, user, request);
  }
}
