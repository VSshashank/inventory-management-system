import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('marks the form invalid when the email is malformed', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.form.controls.email.setValue('not-an-email');
    component.form.controls.password.setValue('');

    expect(component.form.invalid).toBe(true);
    expect(component.form.controls.email.invalid).toBe(true);
    expect(component.form.controls.password.invalid).toBe(true);
  });

  it('switches to the code step when the backend asks for MFA', async () => {
    const httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.form.controls.email.setValue('admin@example.com');
    component.form.controls.password.setValue('AdminDemo!2026');
    component.submit();

    httpMock
      .expectOne(`${environment.apiBaseUrl}/auth/login`)
      .flush({ mfaRequired: true, pendingToken: 'pending-token-123' });

    await fixture.whenStable();
    fixture.detectChanges();

    // The password step is replaced by the authenticator-code step rather than
    // the user being dropped back to a generic failure.
    expect(component.mfaRequired()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('authenticator');

    component.mfaForm.controls.code.setValue('12345');
    expect(component.mfaForm.invalid).toBe(true);

    component.mfaForm.controls.code.setValue('123456');
    expect(component.mfaForm.valid).toBe(true);

    httpMock.verify({ ignoreCancelled: true });
  });
});
