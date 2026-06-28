import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';

const RETURN_URL_KEY = 'wardrobe.auth.returnUrl';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="grid min-h-[calc(100vh-7rem)] place-items-center text-center">
      <p class="text-sm text-muted">Opening sign in...</p>
    </section>
  `,
})
export class LoginPage {
  private readonly oidcSecurityService = inject(OidcSecurityService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private authorizationStarted = false;

  protected readonly isAuthenticated = toSignal(
    this.oidcSecurityService.isAuthenticated(),
    { initialValue: false },
  );

  constructor() {
    effect(() => {
      if (this.isAuthenticated()) {
        const returnUrl = this.consumeReturnUrl();
        this.router.navigateByUrl(returnUrl);
        return;
      }

      if (this.authorizationStarted || this.isOidcCallback()) {
        return;
      }

      this.authorizationStarted = true;
      sessionStorage.setItem(RETURN_URL_KEY, this.getReturnUrl());
      this.oidcSecurityService.authorize();
    });
  }

  private getReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') ? returnUrl : '/';
  }

  private isOidcCallback(): boolean {
    const queryParams = this.route.snapshot.queryParamMap;
    return (
      queryParams.has('code') ||
      queryParams.has('state') ||
      queryParams.has('session_state') ||
      queryParams.has('error')
    );
  }

  private consumeReturnUrl(): string {
    const returnUrl = sessionStorage.getItem(RETURN_URL_KEY);
    sessionStorage.removeItem(RETURN_URL_KEY);
    return returnUrl?.startsWith('/') ? returnUrl : '/';
  }
}
