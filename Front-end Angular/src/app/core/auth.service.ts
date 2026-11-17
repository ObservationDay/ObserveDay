import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, finalize, map, of, tap } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { LoginResponse, StaffUser } from './models';

interface LoginCredentials {
  email: string;
  password: string;
}

interface StaffSession {
  token: string;
  user: StaffUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'smartconseil.staff-session';
  private session = this.restoreSession();
  private readonly userSubject = new BehaviorSubject<StaffUser | null>(this.session?.user ?? null);

  readonly currentUser$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get currentUser(): StaffUser | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.session?.token ?? null;
  }

  get isAuthenticated(): boolean {
    return this.token !== null && this.currentUser !== null;
  }

  login(credentials: LoginCredentials): Observable<StaffUser> {
    return this.http.post<LoginResponse>(`${API_BASE_URL}/auth/login`, credentials).pipe(
      map((response) => {
        const user = 'data' in response.user ? response.user.data : response.user;
        return { token: response.access_token, user };
      }),
      tap((session) => this.saveSession(session)),
      map(({ user }) => user),
    );
  }

  logout(): Observable<void> {
    if (!this.token) {
      this.clearSession();
      return of(undefined);
    }

    return this.http.delete<void>(`${API_BASE_URL}/auth/logout`).pipe(
      finalize(() => this.clearSession()),
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    this.session = null;
    this.userSubject.next(null);
  }

  private saveSession(session: StaffSession): void {
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.session = session;
    this.userSubject.next(session.user);
  }

  private restoreSession(): StaffSession | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const value: unknown = JSON.parse(raw);
      if (this.isStaffSession(value)) {
        return value;
      }
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }

    localStorage.removeItem(this.storageKey);
    return null;
  }

  private isStaffSession(value: unknown): value is StaffSession {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const session = value as Record<string, unknown>;
    const user = session['user'];
    if (!user || typeof user !== 'object') {
      return false;
    }

    const staffUser = user as Record<string, unknown>;
    return typeof session['token'] === 'string'
      && typeof staffUser['id'] === 'string'
      && typeof staffUser['nom'] === 'string'
      && typeof staffUser['email'] === 'string'
      && (staffUser['role'] === 'admin' || staffUser['role'] === 'formateur');
  }
}
