import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api-config';
import { PaginatedResponse, ResourceResponse, Workshop, WorkshopPayload } from './models';

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<PaginatedResponse<Workshop>> {
    return this.http.get<PaginatedResponse<Workshop>>(`${API_BASE_URL}/ateliers`, {
      params: { per_page: 100 },
    });
  }

  create(payload: WorkshopPayload): Observable<ResourceResponse<Workshop>> {
    return this.http.post<ResourceResponse<Workshop>>(`${API_BASE_URL}/ateliers`, payload);
  }

  update(id: string, payload: WorkshopPayload): Observable<ResourceResponse<Workshop>> {
    return this.http.put<ResourceResponse<Workshop>>(`${API_BASE_URL}/ateliers/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/ateliers/${id}`);
  }
}
