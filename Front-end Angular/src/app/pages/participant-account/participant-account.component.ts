import { AbstractControl, FormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { getApiErrorMessage } from '../../core/api-error';
import { ParticipantAuthService } from '../../core/participant-auth.service';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value as string | undefined;
  const confirmation = control.get('password_confirmation')?.value as string | undefined;
  return !confirmation || password === confirmation ? null : { passwordMismatch: true };
};

type AccountMode = 'login' | 'signup';

@Component({
  selector: 'app-participant-account',
  templateUrl: './participant-account.component.html',
  styleUrls: ['./participant-account.component.css'],
})
export class ParticipantAccountComponent implements OnInit {
  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', Validators.required],
  });

  readonly signupForm = this.formBuilder.nonNullable.group({
    nom: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    password_confirmation: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  mode: AccountMode = 'login';
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly auth: ParticipantAuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'signup' ? 'signup' : 'login';
    if (this.auth.isAuthenticated) {
      void this.router.navigateByUrl('/participant/ateliers');
    }
  }

  submitLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.auth.login(this.loginForm.getRawValue())
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl()),
        error: (error: unknown) => {
          this.errorMessage = getApiErrorMessage(
            error,
            'Connexion impossible. Vérifiez vos identifiants.',
            'Python',
          );
        },
      });
  }

  submitSignup(): void {
    if (this.signupForm.invalid || this.isSubmitting) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.auth.register(this.signupForm.getRawValue())
      .pipe(finalize(() => { this.isSubmitting = false; }))
      .subscribe({
        next: () => void this.router.navigateByUrl(this.returnUrl()),
        error: (error: unknown) => {
          this.errorMessage = getApiErrorMessage(
            error,
            'Impossible de créer votre compte.',
            'Python',
          );
        },
      });
  }

  returnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/participant/') ? returnUrl : '/participant/ateliers';
  }
}
