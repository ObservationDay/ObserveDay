import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from './auth.service';
import { ParticipantAuthService } from './participant-auth.service';
import { StaffLoginGuard } from './staff-login.guard';

describe('StaffLoginGuard', () => {
  let staffAuthenticated: boolean;
  let participantAuthenticated: boolean;
  let guard: StaffLoginGuard;
  let router: Router;

  beforeEach(() => {
    staffAuthenticated = false;
    participantAuthenticated = false;

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        StaffLoginGuard,
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

    guard = TestBed.inject(StaffLoginGuard);
    router = TestBed.inject(Router);
  });

  it('allows signed-out visitors to reach staff login', () => {
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

  it('allows staff even if a participant session also exists', () => {
    staffAuthenticated = true;
    participantAuthenticated = true;

    expect(guard.canActivate()).toBeTrue();
  });
});
