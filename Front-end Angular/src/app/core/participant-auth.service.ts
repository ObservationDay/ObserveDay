import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { Participant, ParticipantAuthResponse } from './models';
import { PARTICIPANT_API_BASE_URL } from './api-config';

interface ParticipantSession {
  token: string;
  participant: Participant;
}

export interface ParticipantRegistrationData {
  nom: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ParticipantLoginData {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class ParticipantAuthService {
  private readonly storageKey = 'smartconseil.participant-session';
  private session = this.restoreSession();
  private readonly participantSubject = new BehaviorSubject<Participant | null>(
    this.session?.participant ?? null,
  );

  readonly currentParticipant$ = this.participantSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get currentParticipant(): Participant | null {
    return this.participantSubject.value;
  }

  get token(): string | null {
    return this.session?.token ?? null;
  }

  get isAuthenticated(): boolean {
    return this.token !== null && this.currentParticipant !== null;
  }

  register(data: ParticipantRegistrationData): Observable<Participant> {
    return this.http
      .post<ParticipantAuthResponse>(`${PARTICIPANT_API_BASE_URL}/participants`, data)
      .pipe(
        tap((response) => this.saveSession(response)),
        map((response) => response.participant),
      );
  }

  login(data: ParticipantLoginData): Observable<Participant> {
    return this.http
      .post<ParticipantAuthResponse>(`${PARTICIPANT_API_BASE_URL}/auth/login`, data)
      .pipe(
        tap((response) => this.saveSession(response)),
        map((response) => response.participant),
      );
  }

  clearSession(): void {
    sessionStorage.removeItem(this.storageKey);
    this.session = null;
    this.participantSubject.next(null);
  }

  private saveSession(response: ParticipantAuthResponse): void {
    const session = {
      token: response.access_token,
      participant: response.participant,
    };
    sessionStorage.setItem(this.storageKey, JSON.stringify(session));
    this.session = session;
    this.participantSubject.next(session.participant);
  }

  private restoreSession(): ParticipantSession | null {
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const value: unknown = JSON.parse(raw);
      if (this.isParticipantSession(value)) {
        return value;
      }
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }

    sessionStorage.removeItem(this.storageKey);
    return null;
  }

  private isParticipantSession(value: unknown): value is ParticipantSession {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const session = value as Record<string, unknown>;
    const participant = session['participant'];
    if (!participant || typeof participant !== 'object') {
      return false;
    }

    const account = participant as Record<string, unknown>;
    return typeof session['token'] === 'string'
      && typeof account['id'] === 'string'
      && typeof account['nom'] === 'string'
      && typeof account['email'] === 'string';
  }
}
