
/*
 * Copyright 2017-present Open Networking Foundation

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/// <reference path="../../../../typings/index.d.ts" />

import * as _ from 'lodash';
import {IXosStyleConfig} from '../../../index';

export interface IXosNavigationRoute {
  label: string;
  state?: string;
  url?: string;
  parent?: string;
  children?: [IXosNavigationRoute];
  opened?: boolean;
}

export interface IXosNavigationService {
  query(): IXosNavigationRoute[];
  add(route: IXosNavigationRoute): void;
}

export class IXosNavigationService {
  static $inject = ['$log', 'StyleConfig'];
  private routes: IXosNavigationRoute[];

  constructor(
    private $log: ng.ILogService,
    private StyleConfig: IXosStyleConfig
  ) {
    const defaultRoutes = [
      {
        label: 'Home',
        state: 'xos.dashboard'
      },
      {
        label: 'Core',
        state: 'xos.core'
      }
    ];
    // adding configuration defined routes
    // this.routes = StyleConfig.routes.concat(defaultRoutes).reverse();
    this.routes = defaultRoutes;
    this.StyleConfig.routes.forEach(r => {
      this.add(r);
    });
  }

  query() {
    return this.routes;
  }

  add(route: IXosNavigationRoute, override: boolean = false) {
    if (angular.isDefined(route.state) && angular.isDefined(route.url)) {
      throw new Error('[XosNavigation] You can\'t provide both state and url');
    }

    // NOTE factor this out in a separate method an eventually use recursion since we can nest more routes
    let preExisting = null;
    const routeExist = _.findIndex(this.routes, (r: IXosNavigationRoute) => {
      if (r.label === route.label && (r.state === route.state || override) && r.parent === route.parent) {
        preExisting = r;
        return true;
      }
      else if (_.findIndex(r.children, route) > -1) {
        preExisting = r;
        return true;
      }
      return false;
    }) > -1;

    if (routeExist && !override) {
      this.$log.warn(`[XosNavigation] Route with label: ${route.label}, state: ${route.state} and parent: ${route.parent} already exists`);
      return;
    }

    if (angular.isDefined(route.parent)) {
      // route parent should be a state for now
      const parentRoute = _.find(this.routes, {state: route.parent});
      if (angular.isDefined(parentRoute)) {
        if (angular.isArray(parentRoute.children)) {
          if (override) {
            _.remove(parentRoute.children, r => r === preExisting);
          }
          parentRoute.children.push(route);
        }
        else {
          parentRoute.children = [route];
        }
      }
      else {
        this.$log.warn(`[XosNavigation] Parent State (${route.parent}) for state: ${route.state} does not exist`);
        return;
      }
    }
    else {
      if (override) {
        _.remove(this.routes, r => r === preExisting);
      }
      this.routes.push(route);
    }
  }
}
