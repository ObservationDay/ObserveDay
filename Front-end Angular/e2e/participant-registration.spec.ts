import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

interface WorkshopCatalogResponse {
  data: Array<{
    id: string;
    titre: string;
    available_seats: number;
  }>;
}

interface StaffLoginResponse {
  user:
    | { role: string }
    | { data: { role: string } };
}

test('participant registration appears in the admin list', async ({ page, request }) => {
  if (process.env.E2E_TEST_DATABASE !== 'true') {
    throw new Error(
      'Refusing to create E2E records. Point both APIs at a disposable test database and set E2E_TEST_DATABASE=true.',
    );
  }

  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD for an admin in the test database.');
  }

  const adminLogin = await request.post('http://127.0.0.1:8000/api/v1/auth/login', {
    data: { email: adminEmail, password: adminPassword },
  });
  if (!adminLogin.ok()) {
    throw new Error(`The E2E admin login failed with HTTP ${adminLogin.status()}.`);
  }

  const adminSession = await adminLogin.json() as StaffLoginResponse;
  const admin = 'data' in adminSession.user ? adminSession.user.data : adminSession.user;
  if (admin.role !== 'admin') {
    throw new Error('E2E_ADMIN_EMAIL must belong to an admin account.');
  }

  const catalogResponse = await request.get('http://127.0.0.1:5000/api/v1/ateliers');
  if (!catalogResponse.ok()) {
    throw new Error(`The participant workshop catalog failed with HTTP ${catalogResponse.status()}.`);
  }

  const catalog = await catalogResponse.json() as WorkshopCatalogResponse;
  if (!catalog.data.some((workshop) => workshop.available_seats > 0)) {
    throw new Error('Add an open workshop with available seats to the E2E test database.');
  }

  const id = randomUUID();
  const participantName = `E2E Participant ${id.slice(0, 8)}`;
  const participantEmail = `e2e-${id}@example.com`;
  const password = `E2e-${randomUUID()}-Pass`;

  await page.goto('/participant/creer-compte');
  await page.getByLabel('Nom complet').fill(participantName);
  await page.getByLabel('Adresse e-mail').fill(participantEmail);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByLabel('Confirmer le mot de passe').fill(password);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page).toHaveURL(/\/participant\/ateliers$/);

  await page.evaluate(() => sessionStorage.removeItem('smartconseil.participant-session'));
  await page.goto('/participant/connexion');
  await page.getByLabel('Adresse e-mail').fill(participantEmail);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/participant\/ateliers$/);

  const availableCard = page.locator('.workshop-card').filter({
    has: page.locator('button.register-button:not([disabled])'),
  }).first();
  await expect(availableCard).toBeVisible();
  const workshopTitle = await availableCard.locator('h3').innerText();
  await availableCard.getByRole('button', { name: 'M’inscrire' }).click();
  await expect(page.locator('.notice-success')).toContainText('Votre inscription');

  await page.goto('/login');
  await page.getByLabel('Adresse e-mail').fill(adminEmail);
  await page.getByLabel('Mot de passe').fill(adminPassword);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/app\/ateliers$/);

  await page.goto('/app/inscriptions');
  const registrationRow = page.getByRole('row').filter({ hasText: participantEmail });
  await expect(registrationRow).toBeVisible();
  await expect(registrationRow).toContainText(workshopTitle);
});
