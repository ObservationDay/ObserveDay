import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/api-error';
import { FormateurService } from '../../core/formateur.service';
import { StaffUser, Workshop, WorkshopPayload } from '../../core/models';
import { WorkshopService } from '../../core/workshop.service';

const workshopDateOrderValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const startsAt = control.get('starts_at')?.value as string | undefined;
  const endsAt = control.get('ends_at')?.value as string | undefined;

  if (!startsAt || !endsAt) {
    return null;
  }

  return new Date(endsAt).getTime() > new Date(startsAt).getTime()
    ? null
    : { invalidDateRange: true };
};

@Component({
  selector: 'app-workshops',
  templateUrl: './workshops.component.html',
  styleUrls: ['./workshops.component.css'],
})
export class WorkshopsComponent implements OnInit {
  readonly form = this.formBuilder.nonNullable.group({
    titre: ['', [Validators.required, Validators.maxLength(180)]],
    description: ['', Validators.required],
    starts_at: ['', Validators.required],
    ends_at: ['', Validators.required],
    capacity: [1, [Validators.required, Validators.min(1)]],
    status: ['ouvert', Validators.required],
    trainer_id: [''],
  }, { validators: workshopDateOrderValidator });

  workshops: Workshop[] = [];
  trainers: StaffUser[] = [];
  isLoading = true;
  isSaving = false;
  editorOpen = false;
  errorMessage = '';
  trainerError = '';
  successMessage = '';
  editingId: string | null = null;
  pendingDeleteId: string | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly workshopService: WorkshopService,
    private readonly formateurService: FormateurService,
    private readonly auth: AuthService,
  ) {}

  get isAdmin(): boolean {
    return this.auth.currentUser?.role === 'admin';
  }

  ngOnInit(): void {
    this.loadWorkshops();
    if (this.isAdmin) {
      this.loadTrainers();
    }
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      titre: '',
      description: '',
      starts_at: '',
      ends_at: '',
      capacity: 1,
      status: 'ouvert',
      trainer_id: '',
    });
    this.errorMessage = '';
    this.successMessage = '';
    this.editorOpen = true;
  }

  startEdit(workshop: Workshop): void {
    this.editingId = workshop.id;
    this.form.reset({
      titre: workshop.titre,
      description: workshop.description,
      starts_at: this.toLocalDateTime(workshop.starts_at),
      ends_at: this.toLocalDateTime(workshop.ends_at),
      capacity: workshop.capacity,
      status: workshop.status,
      trainer_id: workshop.trainer?.id ?? '',
    });
    this.errorMessage = '';
    this.successMessage = '';
    this.editorOpen = true;
  }

  closeEditor(): void {
    this.editorOpen = false;
    this.editingId = null;
  }

  save(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const payload: WorkshopPayload = {
      ...values,
      starts_at: new Date(values.starts_at).toISOString(),
      ends_at: new Date(values.ends_at).toISOString(),
      trainer_id: values.trainer_id || null,
    };

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const request = this.editingId
      ? this.workshopService.update(this.editingId, payload)
      : this.workshopService.create(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.editingId ? 'Atelier mis à jour.' : 'Atelier créé.';
        this.closeEditor();
        this.loadWorkshops();
        this.isSaving = false;
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error, 'Impossible d’enregistrer cet atelier.');
        this.isSaving = false;
      },
    });
  }

  requestDelete(workshop: Workshop): void {
    this.pendingDeleteId = workshop.id;
    this.errorMessage = '';
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  deleteWorkshop(workshop: Workshop): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.workshopService.delete(workshop.id).subscribe({
      next: () => {
        this.pendingDeleteId = null;
        this.successMessage = 'Atelier supprimé.';
        this.loadWorkshops();
      },
      error: (error: unknown) => {
        this.pendingDeleteId = null;
        this.errorMessage = getApiErrorMessage(error, 'Impossible de supprimer cet atelier.');
      },
    });
  }

  private loadWorkshops(): void {
    this.isLoading = true;
    this.workshopService.list().subscribe({
      next: (response) => {
        this.workshops = response.data;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error, 'Impossible de charger les ateliers.');
        this.isLoading = false;
      },
    });
  }

  private loadTrainers(): void {
    this.formateurService.list().subscribe({
      next: (response) => {
        this.trainers = response.data;
      },
      error: (error: unknown) => {
        this.trainerError = getApiErrorMessage(error, 'Impossible de charger les formateurs.');
      },
    });
  }

  private toLocalDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }
}
