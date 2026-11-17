import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { ParticipantAuthService } from '../../core/participant-auth.service';

@Component({
  selector: 'app-participant-layout',
  templateUrl: './participant-layout.component.html',
  styleUrls: ['./participant-layout.component.css'],
})
export class ParticipantLayoutComponent {
  constructor(
    public readonly auth: ParticipantAuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.auth.clearSession();
    void this.router.navigateByUrl('/participant/ateliers');
  }
}
