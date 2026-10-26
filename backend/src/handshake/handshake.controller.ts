import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUserId } from './decorators/current-user-id.decorator';
import { HandshakeResponseDto } from './dto/handshake-response.dto';
import { HandshakeService } from './handshake.service';

// Routes for the handshake between a listing and a client. The frontend calls
// them as /api/..., and the Vite proxy removes the /api prefix.
//
// TODO(auth): protect this controller with the JWT guard once auth is merged.
@Controller('listings/:listingId/handshakes/:clientId')
export class HandshakeController {
  constructor(private readonly handshakeService: HandshakeService) {}

  // Current state of the handshake, so the button can show the right text when
  // the page opens. ParseIntPipe answers 400 if an id is not a number.
  @Get()
  getHandshake(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @CurrentUserId() userId: number,
  ): Promise<HandshakeResponseDto> {
    return this.handshakeService.getHandshake(listingId, clientId, userId);
  }

  // The caller says yes. It answers 200 instead of POST's default 201 because
  // it usually updates an existing handshake instead of creating one.
  @Post('approve')
  @HttpCode(HttpStatus.OK)
  approveHandshake(
    @Param('listingId', ParseIntPipe) listingId: number,
    @Param('clientId', ParseIntPipe) clientId: number,
    @CurrentUserId() userId: number,
  ): Promise<HandshakeResponseDto> {
    return this.handshakeService.approveHandshake(listingId, clientId, userId);
  }
}
