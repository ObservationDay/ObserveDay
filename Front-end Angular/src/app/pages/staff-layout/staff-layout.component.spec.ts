import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../../core/auth.service';
import { StaffUser } from '../../core/models';
import { StaffLayoutComponent } from './staff-layout.component';

describe('StaffLayoutComponent', () => {
  let fixture: ComponentFixture<StaffLayoutComponent>;
  let currentUser: StaffUser;

  beforeEach(async () => {
    currentUser = {
      id: '1',
      nom: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    };

    await TestBed.configureTestingModule({
      declarations: [StaffLayoutComponent],
      imports: [CommonModule, RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            get currentUser() {
              return currentUser;
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffLayoutComponent);
    fixture.detectChanges();
  });

  it('hides the help card for administrators', () => {
    expect(fixture.nativeElement.querySelector('.help-card')).toBeNull();
  });

  it('shows the help card for formateurs', () => {
    currentUser = { ...currentUser, role: 'formateur' };
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.help-card')).not.toBeNull();
  });
});
