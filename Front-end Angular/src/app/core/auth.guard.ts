import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { AuthService } from './auth.service';
import { ParticipantAuthService } from './participant-auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly participantAuth: ParticipantAuthService,
    private readonly router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isAuthenticated) {
      return true;
    }

    const redirectUrl = this.participantAuth.isAuthenticated
      ? '/participant/ateliers'
      : '/login';

    return this.router.createUrlTree([redirectUrl]);
  }
}
