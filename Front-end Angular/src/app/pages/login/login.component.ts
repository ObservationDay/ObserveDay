import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { getApiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  errorMessage = '';
  isSubmitting = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated) {
      void this.router.navigateByUrl('/app/ateliers');
    }

    if (this.route.snapshot.queryParamMap.has('expired')) {
      this.errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
    } else if (this.route.snapshot.queryParamMap.has('logoutFailed')) {
      this.errorMessage = 'Session locale fermée, mais la déconnexion serveur n’a pas pu être confirmée.';
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => void this.router.navigateByUrl('/app/ateliers'),
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error, 'Connexion impossible. Vérifiez vos identifiants.');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
