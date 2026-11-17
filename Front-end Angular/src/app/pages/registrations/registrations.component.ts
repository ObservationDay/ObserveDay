import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/api-error';
import { Registration, Workshop } from '../../core/models';
import { RegistrationService } from '../../core/registration.service';
import { WorkshopService } from '../../core/workshop.service';

@Component({
  selector: 'app-registrations',
  templateUrl: './registrations.component.html',
  styleUrls: ['./registrations.component.css'],
})
export class RegistrationsComponent implements OnInit {
  registrations: Registration[] = [];
  workshops: Workshop[] = [];
  selectedWorkshopId = '';
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  pendingCancelId: string | null = null;
  isCancelling = false;

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly workshopService: WorkshopService,
    private readonly auth: AuthService,
  ) {}

  get isTrainer(): boolean {
    return this.auth.currentUser?.role === 'formateur';
  }

  get isAdmin(): boolean {
    return this.auth.currentUser?.role === 'admin';
  }

  get workshopOptions(): Workshop[] {
    return [...this.workshops].sort((left, right) =>
      left.titre.localeCompare(right.titre, 'fr'),
    );
  }

  get visibleRegistrations(): Registration[] {
    return this.selectedWorkshopId
      ? this.registrations.filter((registration) => registration.workshop_id === this.selectedWorkshopId)
      : this.registrations;
  }

  get activeCount(): number {
    return this.visibleRegistrations.filter((registration) => registration.status === 'inscrit').length;
  }

  get cancelledCount(): number {
    return this.visibleRegistrations.filter((registration) => registration.status === 'annule').length;
  }

  ngOnInit(): void {
    this.loadRegistrations();
    this.loadWorkshops();
  }

  confirmCancellation(registration: Registration): void {
    this.pendingCancelId = registration.id;
    this.errorMessage = '';
  }

  cancelConfirmation(): void {
    this.pendingCancelId = null;
  }

  onWorkshopFilterChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.selectedWorkshopId = target.value;
    }
  }

  cancelRegistration(registration: Registration): void {
    if (this.isCancelling) {
      return;
    }

    this.isCancelling = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.registrationService.cancel(registration.id).subscribe({
      next: (response) => {
        this.registrations = this.registrations.map((item) =>
          item.id === response.data.id ? response.data : item,
        );
        this.pendingCancelId = null;
        this.successMessage = 'Inscription annulée.';
        this.isCancelling = false;
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error, 'Impossible d’annuler cette inscription.');
        this.pendingCancelId = null;
        this.isCancelling = false;
      },
    });
  }

  private loadRegistrations(): void {
    this.isLoading = true;
    this.registrationService.list().subscribe({
      next: (response) => {
        this.registrations = response.data;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error, 'Impossible de charger les inscriptions.');
        this.isLoading = false;
      },
    });
  }

  private loadWorkshops(): void {
    this.workshopService.list().subscribe({
      next: (response) => {
        this.workshops = response.data;
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error, 'Impossible de charger les ateliers.');
      },
    });
  }
}
