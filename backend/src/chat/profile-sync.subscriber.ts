import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { EntitySubscriberInterface, UpdateEvent } from 'typeorm';
import { User } from '../auth/user.entity.js';
import { ChatGateway } from './chat.gateway.js';

const PUBLIC_PROFILE_FIELDS = ['firstName', 'lastName', 'avatarUrl'];

@Injectable()
export class ProfileSyncSubscriber implements EntitySubscriberInterface<User> {
  constructor(
    dataSource: DataSource,
    private readonly chatGateway: ChatGateway,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  afterUpdate(event: UpdateEvent<User>) {
    const changed = event.updatedColumns.map((column) => column.propertyName);
    if (!changed.some((name) => PUBLIC_PROFILE_FIELDS.includes(name))) return;

    const entity = { ...event.databaseEntity, ...event.entity } as Partial<User>;
    const userId = Number(entity.id);
    if (!Number.isSafeInteger(userId) || userId <= 0) return;

    void this.chatGateway
      .broadcastProfile(userId, {
        firstName: entity.firstName ?? null,
        lastName: entity.lastName ?? null,
        avatarUrl: entity.avatarUrl ?? null,
      })
      .catch(() => undefined);
  }
}
