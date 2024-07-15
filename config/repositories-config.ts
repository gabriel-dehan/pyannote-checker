import datasource from 'config/data-source';
import { IocAdapter } from 'routing-controllers';
import { BaseEntity } from 'src/entities/base-entity';
import { User } from 'src/entities/user.entity';
import { Video } from 'src/entities/video.entity';
import { Container } from 'typedi';
import { Repository } from 'typeorm';

// Inspired by https://stackoverflow.com/questions/73928282/how-to-inject-a-repository-with-typedi-and-typeorm

type RepositoriesList = Record<string, Repository<BaseEntity>>;
export type UserRepository = Repository<User>;
export type VideoRepository = Repository<Video>;

/* Register all entities repositories in typedi */
/* You can extend repositories with additional functionalities using .extend({ method: () => {} }) */
export const useRepositories = (): IocAdapter => {
  const repositories: RepositoriesList = {
    UserRepository: datasource.getRepository(User),
    VideoRepository: datasource.getRepository(Video),
  };

  Object.entries(repositories).forEach(([name, repository]) => {
    Container.set(name, repository);
  });
  Container.set('Manager', datasource.manager);

  return Container;
};
