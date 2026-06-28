import { expect, Page, test } from '@playwright/test';

const authority = 'http://localhost:8080/realms/wardrobe';
const authEndpoint = `${authority}/protocol/openid-connect/auth`;

async function mockOidc(page: Page): Promise<void> {
  await page.route('**/realms/wardrobe/.well-known/openid-configuration**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        issuer: authority,
        authorization_endpoint: authEndpoint,
        token_endpoint: `${authority}/protocol/openid-connect/token`,
        userinfo_endpoint: `${authority}/protocol/openid-connect/userinfo`,
        jwks_uri: `${authority}/protocol/openid-connect/certs`,
        end_session_endpoint: `${authority}/protocol/openid-connect/logout`,
        revocation_endpoint: `${authority}/protocol/openid-connect/revoke`,
        response_types_supported: ['code'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'email'],
        token_endpoint_auth_methods_supported: ['none'],
        code_challenge_methods_supported: ['S256'],
      }),
    });
  });

  await page.route('**/realms/wardrobe/protocol/openid-connect/certs**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ keys: [] }),
    });
  });

  await page.route('**/realms/wardrobe/protocol/openid-connect/auth**', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Mock Keycloak</title><h1>Mock Keycloak</h1>',
    });
  });
}

test('protected routes redirect unauthenticated users into OIDC authorization', async ({ page }) => {
  await mockOidc(page);

  await page.goto('/items');

  await expect(page).toHaveURL(/\/realms\/wardrobe\/protocol\/openid-connect\/auth/);
  await expect(page.getByRole('heading', { name: 'Mock Keycloak' })).toBeVisible();

  const authUrl = new URL(page.url());
  expect(authUrl.searchParams.get('client_id')).toBe('wardrobe-frontend');
  expect(authUrl.searchParams.get('scope')).toContain('openid');
  expect(authUrl.searchParams.get('redirect_uri')).toContain('/login');
});
