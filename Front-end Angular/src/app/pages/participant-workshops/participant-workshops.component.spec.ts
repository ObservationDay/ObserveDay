import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { ParticipantApiService } from '../../core/participant-api.service';
import { ParticipantAuthService } from '../../core/participant-auth.service';
import { Registration, Workshop } from '../../core/models';
import { ParticipantWorkshopsComponent } from './participant-workshops.component';

describe('ParticipantWorkshopsComponent', () => {
  let fixture: ComponentFixture<ParticipantWorkshopsComponent>;
  let isAuthenticated: boolean;
  let participantApi: jasmine.SpyObj<ParticipantApiService>;

  const registration = createRegistration();

  beforeEach(async () => {
    isAuthenticated = true;
    participantApi = jasmine.createSpyObj<ParticipantApiService>(
      'ParticipantApiService',
      ['listAvailableWorkshops', 'listMyRegistrations', 'registerForWorkshop'],
    );
    participantApi.listAvailableWorkshops.and.returnValue(of(createPage([])));
    participantApi.listMyRegistrations.and.returnValue(of(createPage([registration])));

    await TestBed.configureTestingModule({
      declarations: [ParticipantWorkshopsComponent],
      imports: [CommonModule, RouterTestingModule],
      providers: [
        { provide: ParticipantApiService, useValue: participantApi },
        {
          provide: ParticipantAuthService,
          useValue: {
            get isAuthenticated() {
              return isAuthenticated;
            },
            currentParticipant: {
              id: 'participant-1',
              nom: 'Participant',
              email: 'participant@example.test',
            },
            token: 'participant-token',
          },
        },
      ],
    }).compileComponents();
  });

  it('shows the signed-in participant their registered workshops', () => {
    fixture = TestBed.createComponent(ParticipantWorkshopsComponent);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector('.my-registrations') as HTMLElement;
    expect(participantApi.listMyRegistrations).toHaveBeenCalledTimes(1);
    expect(section.textContent).toContain('Atelier Alpha');
    expect(section.textContent).toContain('Confirmée');
  });

  it('does not request or show registrations for a guest', () => {
    isAuthenticated = false;
    fixture = TestBed.createComponent(ParticipantWorkshopsComponent);
    fixture.detectChanges();

    expect(participantApi.listMyRegistrations).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.my-registrations')).toBeNull();
  });
});

function createPage<T>(data: T[]) {
  return {
    data,
    meta: { current_page: 1, last_page: 1, total: data.length },
  };
}

function createRegistration(): Registration {
  const workshop: Workshop = {
    id: 'workshop-1',
    titre: 'Atelier Alpha',
    description: 'Introduction au sujet.',
    starts_at: '2026-11-18T07:20:00Z',
    ends_at: '2026-11-18T09:20:00Z',
    capacity: 10,
    status: 'ouvert',
    trainer: {
      id: 'trainer-1',
      nom: 'Formateur',
      email: 'trainer@example.test',
      role: 'formateur',
    },
  };

  return {
    id: 'registration-1',
    workshop_id: workshop.id,
    participant_id: 'participant-1',
    status: 'inscrit',
    registered_at: '2026-11-17T12:00:00Z',
    workshop,
    participant: {
      participant_id: 'participant-1',
      nom_affiche: 'Participant',
      email: 'participant@example.test',
      synced_at: '2026-11-17T12:00:00Z',
    },
  };
}
