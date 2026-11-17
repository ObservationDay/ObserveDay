import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { API_BASE_URL, PARTICIPANT_API_BASE_URL } from './api-config';
import { ParticipantAuthService } from './participant-auth.service';
import { PaginatedResponse, Registration, ResourceResponse, Workshop } from './models';

@Injectable({ providedIn: 'root' })
export class ParticipantApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: ParticipantAuthService,
  ) {}

  listAvailableWorkshops(): Observable<PaginatedResponse<Workshop>> {
    return this.http.get<PaginatedResponse<Workshop>>(
      `${API_BASE_URL}/participant/ateliers`,
    );
  }

  listMyRegistrations(): Observable<PaginatedResponse<Registration>> {
    const request = this.http.get<PaginatedResponse<Registration>>(
      `${PARTICIPANT_API_BASE_URL}/inscriptions`,
      { headers: this.participantHeaders() },
    );

    return this.clearSessionOnUnauthorized(request);
  }

  registerForWorkshop(workshopId: string): Observable<ResourceResponse<Registration>> {
    const request = this.http.post<ResourceResponse<Registration>>(
      `${API_BASE_URL}/participant/inscriptions`,
      { workshop_id: workshopId },
      { headers: this.participantHeaders() },
    );

    return this.clearSessionOnUnauthorized(request);
  }

  private participantHeaders(): HttpHeaders {
    const token = this.auth.token;
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  private clearSessionOnUnauthorized<T>(request: Observable<T>): Observable<T> {
    return request.pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.auth.clearSession();
        }
        return throwError(() => error);
      }),
    );
  }
}
