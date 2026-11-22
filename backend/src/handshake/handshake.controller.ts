import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { ChatHandshakeDto, HandshakeResponseDto } from './dto/handshake-response.dto.js';
import { HandshakeService } from './handshake.service.js';

@Controller()
@UseGuards(JwtAuthGuard)
export class HandshakeController {
  constructor(private readonly handshakeService: HandshakeService) {}

  // gets the handshake state
  @Get('listings/:listingId/handshakes/:clientId')
  getHandshake(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<HandshakeResponseDto> {
    return this.handshakeService.getHandshake(listingId, clientId, request.user!.sub);
  }

  // the user says yes
  @Post('listings/:listingId/handshakes/:clientId/approve')
  @HttpCode(HttpStatus.OK)
  approveHandshake(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<HandshakeResponseDto> {
    return this.handshakeService.approveHandshake(listingId, clientId, request.user!.sub);
  }

  // gets the listing of a chat
  @Get('conversations/:conversationId/handshake')
  getForConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<ChatHandshakeDto> {
    return this.handshakeService.getForConversation(conversationId, request.user!.sub);
  }
}
