import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const user = this.auth.currentUser;
    const roles = route.data['roles'];

    if (!user) {
      return this.router.createUrlTree(['/login']);
    }

    if (Array.isArray(roles) && roles.includes(user.role)) {
      return true;
    }

    return this.router.createUrlTree(['/app/ateliers']);
  }
}
