import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { PARTICIPANT_API_BASE_URL } from './api-config';
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
      `${PARTICIPANT_API_BASE_URL}/ateliers`,
    );
  }

  registerForWorkshop(workshopId: string): Observable<ResourceResponse<Registration>> {
    const token = this.auth.token;
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http
      .post<ResourceResponse<Registration>>(
        `${PARTICIPANT_API_BASE_URL}/inscriptions`,
        { workshop_id: workshopId },
        { headers },
      )
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.auth.clearSession();
          }
          return throwError(() => error);
        }),
      );
  }
}
