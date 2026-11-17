import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { PaginatedResponse, Registration, ResourceResponse } from './models';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<PaginatedResponse<Registration>> {
    return this.http.get<PaginatedResponse<Registration>>(`${API_BASE_URL}/inscriptions`, {
      params: { per_page: 100 },
    });
  }

  cancel(id: string): Observable<ResourceResponse<Registration>> {
    return this.http.patch<ResourceResponse<Registration>>(
      `${API_BASE_URL}/inscriptions/${id}/annulation`,
      {},
    );
  }
}
