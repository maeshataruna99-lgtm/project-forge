import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway({ cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' } })
export class RealtimeGateway {
  @SubscribeMessage('ping')
  ping(payload: unknown) {
    return { event: 'pong', data: { received: payload ?? null } };
  }
}
