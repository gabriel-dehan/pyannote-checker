import datasource from 'config/data-source';
import * as middlewares from 'config/routing-middlewares';
import { Action, RoutingControllersOptions } from 'routing-controllers';
import * as controllers from 'src/controllers';
import { User } from 'src/entities/user.entity';
import { getEnumValues } from 'src/utils/getEnumValues';

export const routingConfigs: RoutingControllersOptions = {
  controllers: getEnumValues(controllers),
  middlewares: getEnumValues(middlewares),
  interceptors: [],
  routePrefix: '',
  validation: true,
  authorizationChecker: async (action: Action, roles: string[]) => {
    if (action.context.state?.user?.sub) {
      const user = await datasource
        .getRepository(User)
        .findOne({ where: { id: action.context.state.user.sub } });

      if (!user) {
        return false;
      }

      return roles.includes(user.role);
    } else {
      return false;
    }
  },
  currentUserChecker: async (action: Action) => {
    return await datasource
      .getRepository(User)
      .findOne({ where: { id: action.context.state.user.sub } });
  },
};
