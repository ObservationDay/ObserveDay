import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ParticipantAuthService } from './participant-auth.service';

describe('AuthGuard', () => {
  let staffAuthenticated: boolean;
  let participantAuthenticated: boolean;
  let guard: AuthGuard;
  let router: Router;

  beforeEach(() => {
    staffAuthenticated = false;
    participantAuthenticated = false;

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        {
          provide: AuthService,
          useValue: { get isAuthenticated() { return staffAuthenticated; } },
        },
        {
          provide: ParticipantAuthService,
          useValue: { get isAuthenticated() { return participantAuthenticated; } },
        },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  it('allows authenticated staff', () => {
    staffAuthenticated = true;

    expect(guard.canActivate()).toBeTrue();
  });

  it('redirects authenticated participants to their workshops', () => {
    participantAuthenticated = true;

    const result = guard.canActivate();

    expect(result instanceof UrlTree).toBeTrue();
    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/participant/ateliers');
    }
  });

  it('redirects signed-out visitors to staff login', () => {
    const result = guard.canActivate();

    expect(result instanceof UrlTree).toBeTrue();
    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/login');
    }
  });
});
