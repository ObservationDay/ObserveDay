import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { getApiErrorMessage } from '../../core/api-error';
import { ParticipantApiService } from '../../core/participant-api.service';
import { ParticipantAuthService } from '../../core/participant-auth.service';
import { Registration, Workshop } from '../../core/models';

@Component({
  selector: 'app-participant-workshops',
  templateUrl: './participant-workshops.component.html',
  styleUrls: ['./participant-workshops.component.css'],
})
export class ParticipantWorkshopsComponent implements OnInit {
  workshops: Workshop[] = [];
  myRegistrations: Registration[] = [];
  isLoading = true;
  isLoadingRegistrations = false;
  pendingWorkshopId: string | null = null;
  errorMessage = '';
  registrationsErrorMessage = '';
  successMessage = '';

  constructor(
    private readonly api: ParticipantApiService,
    public readonly auth: ParticipantAuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadWorkshops();
    if (this.auth.isAuthenticated) {
      this.loadMyRegistrations();
    }
  }

  availableSeats(workshop: Workshop): number {
    return workshop.available_seats
      ?? Math.max(0, workshop.capacity - (workshop.active_registrations ?? 0));
  }

  register(workshop: Workshop): void {
    if (!this.auth.isAuthenticated) {
      void this.router.navigate(['/participant/connexion'], {
        queryParams: { returnUrl: '/participant/ateliers' },
      });
      return;
    }

    if (this.pendingWorkshopId) {
      return;
    }

    this.pendingWorkshopId = workshop.id;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.registerForWorkshop(workshop.id).subscribe({
      next: (response) => {
        this.successMessage = `Votre inscription à « ${response.data.workshop?.titre ?? workshop.titre} » est confirmée.`;
        this.pendingWorkshopId = null;
        this.loadWorkshops();
        this.loadMyRegistrations();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(
          error,
          'Impossible de vous inscrire à cet atelier.',
          'Python',
        );
        this.pendingWorkshopId = null;
      },
    });
  }

  private loadWorkshops(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.api.listAvailableWorkshops().subscribe({
      next: (response) => {
        this.workshops = response.data;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(
          error,
          'Impossible de charger les ateliers. Vérifiez que Flask et Laravel démarrent.',
          'Python',
        );
        this.isLoading = false;
      },
    });
  }

  private loadMyRegistrations(): void {
    this.isLoadingRegistrations = true;
    this.registrationsErrorMessage = '';
    this.api.listMyRegistrations().subscribe({
      next: (response) => {
        this.myRegistrations = response.data;
        this.isLoadingRegistrations = false;
      },
      error: (error: unknown) => {
        this.registrationsErrorMessage = getApiErrorMessage(
          error,
          'Impossible de charger vos inscriptions.',
          'Python',
        );
        this.isLoadingRegistrations = false;
      },
    });
  }
}
