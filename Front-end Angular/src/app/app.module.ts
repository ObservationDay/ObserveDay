import { LOCALE_ID, NgModule } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthGuard } from './core/auth.guard';
import { AuthInterceptor } from './core/auth.interceptor';
import { RoleGuard } from './core/role.guard';
import { StaffLoginGuard } from './core/staff-login.guard';
import { LoginComponent } from './pages/login/login.component';
import { ParticipantAccountComponent } from './pages/participant-account/participant-account.component';
import { ParticipantLayoutComponent } from './pages/participant-layout/participant-layout.component';
import { ParticipantWorkshopsComponent } from './pages/participant-workshops/participant-workshops.component';
import { RegistrationsComponent } from './pages/registrations/registrations.component';
import { StaffLayoutComponent } from './pages/staff-layout/staff-layout.component';
import { WorkshopsComponent } from './pages/workshops/workshops.component';

registerLocaleData(localeFr, 'fr-FR');

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [StaffLoginGuard] },
  {
    path: 'participant',
    component: ParticipantLayoutComponent,
    children: [
      { path: '', redirectTo: 'ateliers', pathMatch: 'full' },
      { path: 'ateliers', component: ParticipantWorkshopsComponent },
      {
        path: 'connexion',
        component: ParticipantAccountComponent,
        data: { mode: 'login' },
      },
      {
        path: 'creer-compte',
        component: ParticipantAccountComponent,
        data: { mode: 'signup' },
      },
    ],
  },
  {
    path: 'app',
    component: StaffLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'ateliers', pathMatch: 'full' },
      {
        path: 'ateliers',
        component: WorkshopsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'formateur'] },
      },
      {
        path: 'inscriptions',
        component: RegistrationsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'formateur'] },
      },
    ],
  },
  { path: '', redirectTo: 'participant/ateliers', pathMatch: 'full' },
  { path: '**', redirectTo: 'participant/ateliers' },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ParticipantAccountComponent,
    ParticipantLayoutComponent,
    ParticipantWorkshopsComponent,
    RegistrationsComponent,
    StaffLayoutComponent,
    WorkshopsComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'fr-FR' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
