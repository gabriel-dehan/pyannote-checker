import { BaseEntity } from 'src/entities/base-entity';
import { EntityPartial } from 'src/utils/entityPartial';
import { Column, Entity } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity()
export class User extends BaseEntity {
  constructor(input?: EntityPartial<User>) {
    super(input);
  }

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;
}
