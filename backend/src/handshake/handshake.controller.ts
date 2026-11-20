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

// Routes for the handshake between a listing and a client. JwtAuthGuard reads
// the login cookie, so the caller's id always comes from the token and nobody
// can act in someone else's name
@Controller()
@UseGuards(JwtAuthGuard)
export class HandshakeController {
  constructor(private readonly handshakeService: HandshakeService) {}

  // Current state of the handshake, so the button can show the right text when
  // the page opens. ParseIntPipe answers 400 if an id is not a number.
  @Get('listings/:listingId/handshakes/:clientId')
  getHandshake(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<HandshakeResponseDto> {
    return this.handshakeService.getHandshake(listingId, clientId, request.user!.sub);
  }

  // The caller says yes. It answers 200 instead of POST's default 201 because
  // it usually updates an existing handshake instead of creating one.
  @Post('listings/:listingId/handshakes/:clientId/approve')
  @HttpCode(HttpStatus.OK)
  approveHandshake(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<HandshakeResponseDto> {
    return this.handshakeService.approveHandshake(listingId, clientId, request.user!.sub);
  }

  // The listing a chat is about, so the chat can show the handshake button
  @Get('conversations/:conversationId/handshake')
  getForConversation(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<ChatHandshakeDto> {
    return this.handshakeService.getForConversation(conversationId, request.user!.sub);
  }
}
