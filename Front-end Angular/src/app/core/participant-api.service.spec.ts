import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { API_BASE_URL, PARTICIPANT_API_BASE_URL } from './api-config';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { ParticipantApiService } from './participant-api.service';
import { ParticipantAuthService } from './participant-auth.service';

describe('ParticipantApiService', () => {
  let api: ParticipantApiService;
  let participantAuth: ParticipantAuthService;
  let staffAuth: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });

    api = TestBed.inject(ParticipantApiService);
    participantAuth = TestBed.inject(ParticipantAuthService);
    staffAuth = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('creates a participant account through Python and stores its session', () => {
    participantAuth.register({
      nom: 'Participant Test',
      email: 'participant@example.com',
      password: 'correct-horse-battery',
      password_confirmation: 'correct-horse-battery',
    }).subscribe();

    const request = httpMock.expectOne(`${PARTICIPANT_API_BASE_URL}/participants`);
    expect(request.request.method).toBe('POST');
    request.flush({
      access_token: 'participant-token',
      token_type: 'Bearer',
      participant: {
        id: 'participant-id',
        nom: 'Participant Test',
        email: 'participant@example.com',
      },
    });

    expect(participantAuth.token).toBe('participant-token');
    expect(participantAuth.currentParticipant?.id).toBe('participant-id');
  });

  it('restores staff authentication in another tab', () => {
    staffAuth.login({ email: 'admin@example.com', password: 'admin-password' }).subscribe();
    httpMock.expectOne(`${API_BASE_URL}/auth/login`).flush({
      access_token: 'staff-token',
      token_type: 'Bearer',
      user: {
        id: 'staff-id',
        nom: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    const anotherTabAuth = new AuthService(TestBed.inject(HttpClient));

    expect(anotherTabAuth.isAuthenticated).toBeTrue();
    expect(anotherTabAuth.currentUser?.email).toBe('admin@example.com');
    expect(anotherTabAuth.token).toBe('staff-token');
  });

  it('restores participant authentication in another tab', () => {
    participantAuth.login({
      email: 'participant@example.com',
      password: 'participant-password',
    }).subscribe();
    httpMock.expectOne(`${PARTICIPANT_API_BASE_URL}/auth/login`).flush({
      access_token: 'participant-token',
      token_type: 'Bearer',
      participant: {
        id: 'participant-id',
        nom: 'Participant Test',
        email: 'participant@example.com',
      },
    });

    const anotherTabAuth = new ParticipantAuthService(TestBed.inject(HttpClient));

    expect(anotherTabAuth.isAuthenticated).toBeTrue();
    expect(anotherTabAuth.currentParticipant?.email).toBe('participant@example.com');
    expect(anotherTabAuth.token).toBe('participant-token');
  });

  it('uses the participant token for enrollment without leaking the staff token', () => {
    staffAuth.login({ email: 'admin@example.com', password: 'admin-password' }).subscribe();
    httpMock.expectOne(`${API_BASE_URL}/auth/login`).flush({
      access_token: 'staff-token',
      token_type: 'Bearer',
      user: {
        id: 'staff-id',
        nom: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    participantAuth.login({
      email: 'participant@example.com',
      password: 'participant-password',
    }).subscribe();
    httpMock.expectOne(`${PARTICIPANT_API_BASE_URL}/auth/login`).flush({
      access_token: 'participant-token',
      token_type: 'Bearer',
      participant: {
        id: 'participant-id',
        nom: 'Participant Test',
        email: 'participant@example.com',
      },
    });

    api.registerForWorkshop('workshop-id').subscribe();
    const request = httpMock.expectOne(`${PARTICIPANT_API_BASE_URL}/inscriptions`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer participant-token');
    expect(request.request.headers.get('Authorization')).not.toBe('Bearer staff-token');
    expect(request.request.body).toEqual({ workshop_id: 'workshop-id' });
    request.flush({ data: { id: 'registration-id' } });
  });

  it('loads the participant registration list with only the participant token', () => {
    participantAuth.login({
      email: 'participant@example.com',
      password: 'participant-password',
    }).subscribe();
    httpMock.expectOne(`${PARTICIPANT_API_BASE_URL}/auth/login`).flush({
      access_token: 'participant-token',
      token_type: 'Bearer',
      participant: {
        id: 'participant-id',
        nom: 'Participant Test',
        email: 'participant@example.com',
      },
    });

    api.listMyRegistrations().subscribe();
    const request = httpMock.expectOne(`${PARTICIPANT_API_BASE_URL}/inscriptions`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Authorization')).toBe('Bearer participant-token');
    request.flush({ data: [], links: {}, meta: { total: 0 } });
  });
});
