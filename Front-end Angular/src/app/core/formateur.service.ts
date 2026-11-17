import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { PaginatedResponse, StaffUser } from './models';

@Injectable({ providedIn: 'root' })
export class FormateurService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<PaginatedResponse<StaffUser>> {
    return this.http.get<PaginatedResponse<StaffUser>>(`${API_BASE_URL}/formateurs`, {
      params: { per_page: 100 },
    });
  }
}
