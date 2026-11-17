import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isParticipantApiRequest = request.url.startsWith(`${API_BASE_URL}/participant/`);
    const isStaffApiRequest = request.url.startsWith(API_BASE_URL) && !isParticipantApiRequest;
    const isLoginRequest = request.url === `${API_BASE_URL}/auth/login`;
    const token = isStaffApiRequest ? this.auth.token : null;
    const authenticatedRequest = token && !isLoginRequest
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

    return next.handle(authenticatedRequest).pipe(
      catchError((error: unknown) => {
        if (
          isStaffApiRequest
          && typeof error === 'object'
          && error !== null
          && 'status' in error
          && error.status === 401
          && !isLoginRequest
        ) {
          this.auth.clearSession();
          void this.router.navigate(['/login'], { queryParams: { expired: '1' } });
        }

        return throwError(() => error);
      }),
    );
  }
}
