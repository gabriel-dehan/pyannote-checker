import { faker } from '@faker-js/faker';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';

// Small util to map n times asynchrnously
const times = async (n: number, cb: (n: number) => Record<string, any>) =>
  Promise.all(Array(n).fill(null).map(cb));

// const randomNumeric = (min: number, max: number) => {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// };

export const seedApplication = async (datasource: DataSource) => {
  /* Users */
  const users = await times(2, async () => {
    const user = {
      name: faker.name.firstName(),
      email: faker.internet.email(),
    };

    await datasource.getRepository(User).save(user);
    return user;
  });

  return {
    users,
  };
};
