import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.auth.token;
    const authenticatedRequest = token && !request.url.endsWith('/auth/login')
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

    return next.handle(authenticatedRequest).pipe(
      catchError((error: unknown) => {
        if (
          typeof error === 'object'
          && error !== null
          && 'status' in error
          && error.status === 401
          && !request.url.endsWith('/auth/login')
        ) {
          this.auth.clearSession();
          void this.router.navigate(['/login'], { queryParams: { expired: '1' } });
        }

        return throwError(() => error);
      }),
    );
  }
}
