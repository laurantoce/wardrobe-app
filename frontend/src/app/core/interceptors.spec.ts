import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { bearerTokenInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

describe('HTTP interceptors', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let getAccessToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getAccessToken = vi.fn(() => of('token-123'));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([bearerTokenInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: OidcSecurityService, useValue: { getAccessToken } },
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  it('adds a bearer token to API requests', async () => {
    const response = firstValueFrom(client.get('/api/garments'));

    const req = http.expectOne('/api/garments');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush([]);

    await expect(response).resolves.toEqual([]);
    http.verify();
  });

  it('leaves non-API requests untouched', async () => {
    const response = firstValueFrom(client.get('/assets/config.json'));

    const req = http.expectOne('/assets/config.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(getAccessToken).not.toHaveBeenCalled();
    req.flush({});

    await expect(response).resolves.toEqual({});
    http.verify();
  });

  it('normalizes FastAPI detail errors', async () => {
    const response = firstValueFrom(client.get('/api/garments/404')).catch((error) => error);

    const req = http.expectOne('/api/garments/404');
    req.flush({ detail: 'Garment not found' }, { status: 404, statusText: 'Not Found' });

    await expect(response).resolves.toEqual({ status: 404, message: 'Garment not found' });
    http.verify();
  });
});
