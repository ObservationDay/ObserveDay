import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/api-error';
import { Registration } from '../../core/models';
import { RegistrationService } from '../../core/registration.service';

@Component({
  selector: 'app-registrations',
  templateUrl: './registrations.component.html',
  styleUrls: ['./registrations.component.css'],
})
export class RegistrationsComponent implements OnInit {
  registrations: Registration[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  pendingCancelId: string | null = null;
  isCancelling = false;

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly auth: AuthService,
  ) {}

  get isTrainer(): boolean {
    return this.auth.currentUser?.role === 'formateur';
  }

  get activeCount(): number {
    return this.registrations.filter((registration) => registration.status === 'inscrit').length;
  }

  get cancelledCount(): number {
    return this.registrations.filter((registration) => registration.status === 'annule').length;
  }

  ngOnInit(): void {
    this.loadRegistrations();
  }

  confirmCancellation(registration: Registration): void {
    this.pendingCancelId = registration.id;
    this.errorMessage = '';
  }

  cancelConfirmation(): void {
    this.pendingCancelId = null;
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
}
