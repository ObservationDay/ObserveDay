import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth.service';
import { Registration, StaffUser, Workshop } from '../../core/models';
import { RegistrationService } from '../../core/registration.service';
import { WorkshopService } from '../../core/workshop.service';
import { RegistrationsComponent } from './registrations.component';

describe('RegistrationsComponent', () => {
  let fixture: ComponentFixture<RegistrationsComponent>;
  let currentUser: StaffUser;
  let registrationService: jasmine.SpyObj<RegistrationService>;
  let workshopService: jasmine.SpyObj<WorkshopService>;

  const registrations: Registration[] = [
    createRegistration('registration-1', 'workshop-1', 'Atelier Alpha'),
    createRegistration('registration-2', 'workshop-1', 'Atelier Alpha'),
    createRegistration('registration-3', 'workshop-2', 'Atelier Beta'),
  ];
  const workshops = [
    createWorkshop('workshop-1', 'Atelier Alpha'),
    createWorkshop('workshop-2', 'Atelier Beta'),
    createWorkshop('workshop-3', 'Atelier Gamma'),
  ];

  beforeEach(async () => {
    currentUser = {
      id: 'admin-1',
      nom: 'Admin',
      email: 'admin@example.test',
      role: 'admin',
    };
    registrationService = jasmine.createSpyObj<RegistrationService>('RegistrationService', ['list', 'cancel']);
    registrationService.list.and.returnValue(of(createPage(registrations)));
    workshopService = jasmine.createSpyObj<WorkshopService>('WorkshopService', ['list']);
    workshopService.list.and.returnValue(of(createPage(workshops)));

    await TestBed.configureTestingModule({
      declarations: [RegistrationsComponent],
      imports: [CommonModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            get currentUser() {
              return currentUser;
            },
          },
        },
        { provide: RegistrationService, useValue: registrationService },
        { provide: WorkshopService, useValue: workshopService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationsComponent);
    fixture.detectChanges();
  });

  it('shows all registrations by default and offers each workshop once', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    expect(select.value).toBe('');
    expect(Array.from(select.options).map((option) => option.textContent?.trim())).toEqual([
      'TOUS LES ATELIERS',
      'Atelier Alpha',
      'Atelier Beta',
      'Atelier Gamma',
    ]);
    expect(rows.length).toBe(3);
  });

  it('filters registrations to the selected workshop', () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'workshop-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const tableBody = fixture.nativeElement.querySelector('tbody') as HTMLElement;
    const rows = tableBody.querySelectorAll('tr');
    expect(rows.length).toBe(2);
    expect(tableBody.textContent).toContain('Atelier Alpha');
    expect(tableBody.textContent).not.toContain('Atelier Beta');
  });

  it('lets trainers filter only the workshops assigned to them', () => {
    fixture.destroy();
    currentUser = {
      id: 'trainer-1',
      nom: 'Formateur',
      email: 'trainer@example.test',
      role: 'formateur',
    };
    registrationService.list.and.returnValue(of(createPage(registrations.slice(0, 2))));
    workshopService.list.and.returnValue(of(createPage([workshops[0], workshops[2]])));

    fixture = TestBed.createComponent(RegistrationsComponent);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.textContent?.trim())).toEqual([
      'MES ATELIERS',
      'Atelier Alpha',
      'Atelier Gamma',
    ]);

    select.value = 'workshop-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
  });
});

function createPage<T>(data: T[]) {
  return {
    data,
    meta: { current_page: 1, last_page: 1, total: data.length },
  };
}

function createWorkshop(id: string, title: string): Workshop {
  return {
    id,
    titre: title,
    description: '',
    starts_at: '2026-11-18T07:20:00Z',
    ends_at: '2026-11-18T09:20:00Z',
    capacity: 10,
    status: 'planifie',
    trainer: null,
  };
}

function createRegistration(id: string, workshopId: string, title: string): Registration {
  return {
    id,
    workshop_id: workshopId,
    participant_id: `participant-${id}`,
    status: 'inscrit',
    registered_at: '2026-11-17T12:00:00Z',
    workshop: {
      id: workshopId,
      titre: title,
      description: '',
      starts_at: '2026-11-18T07:20:00Z',
      ends_at: '2026-11-18T09:20:00Z',
      capacity: 10,
      status: 'planifie',
      trainer: null,
    },
    participant: {
      participant_id: `participant-${id}`,
      nom_affiche: `Participant ${id}`,
      email: `${id}@example.test`,
      synced_at: '2026-11-17T12:00:00Z',
    },
  };
}
