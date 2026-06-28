import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authGuard } from './auth.guard';

async function resolveGuard(url: string): Promise<unknown> {
  const result = TestBed.runInInjectionContext(() =>
    authGuard({} as never, { url } as RouterStateSnapshot),
  );

  if (isObservable(result)) {
    return firstValueFrom(result);
  }
  return result instanceof Promise ? result : Promise.resolve(result);
}

describe('authGuard', () => {
  let isAuthenticated: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(() => {
    isAuthenticated = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: OidcSecurityService, useValue: { isAuthenticated } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('allows authenticated users through', async () => {
    isAuthenticated.mockReturnValue(of(true));

    await expect(resolveGuard('/items')).resolves.toBe(true);
  });

  it('redirects unauthenticated users to login with returnUrl', async () => {
    isAuthenticated.mockReturnValue(of(false));

    const result = await resolveGuard('/items');

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fitems');
  });
});
