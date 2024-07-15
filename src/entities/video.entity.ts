import { BaseEntity } from 'src/entities/base-entity';
import { EntityPartial } from 'src/utils/entityPartial';
import { Column, Entity } from 'typeorm';

@Entity()
export class Video extends BaseEntity {
  constructor(input?: EntityPartial<Video>) {
    super(input);
  }

  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  lastDiarizationJobId: string;
}
