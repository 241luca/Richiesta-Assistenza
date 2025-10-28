import { test, expect } from '@playwright/test';

test.describe('Verifica persistenza modal indirizzo dopo invio richiesta', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina dell'applicazione
    await page.goto('http://localhost:5193');
    
    // Attendi che la pagina sia caricata
    await page.waitForLoadState('networkidle');
  });

  test('il modal indirizzo dovrebbe rimanere aperto dopo invio richiesta', async ({ page }) => {
    // 1. Fai login usando il pulsante di accesso rapido
    const quickLoginButton = page.locator('button:has-text("Super Admin")');
    if (await quickLoginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await quickLoginButton.click();
      await page.waitForLoadState('networkidle');
      // Attendi che il redirect al dashboard sia completato
      await page.waitForTimeout(2000);
    }

    // 2. Apri il modal "Nuova Richiesta"
    const newRequestButton = page.locator('button:has-text("Nuova Richiesta"), button:has-text("New Request")');
    await newRequestButton.click();
    
    // Verifica che il modal sia aperto
    const modal = page.locator('[role="dialog"], .modal, div:has(button:has-text("Salva"))');
    await expect(modal).toBeVisible();

    // 3. Compila i campi obbligatori
    await page.fill('input[placeholder*="Nome"], input[name="firstName"]', 'Mario');
    await page.fill('input[placeholder*="Cognome"], input[name="lastName"]', 'Rossi');
    await page.fill('input[type="email"]', 'mario.rossi@example.com');
    await page.fill('input[type="tel"], input[placeholder*="Telefono"]', '1234567890');

    // 4. Seleziona un modulo
    const moduleSelect = page.locator('select, div[role="combobox"]').first();
    await moduleSelect.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // 5. Compila il campo descrizione
    await page.fill('textarea', 'Richiesta di test per verificare la persistenza del modal indirizzo');

    // 6. Attendi un momento per assicurarsi che tutti i campi siano compilati
    await page.waitForTimeout(1000);

    // 7. Clicca sul pulsante "Salva" per inviare la richiesta
    const saveButton = page.locator('button:has-text("Salva"), button:has-text("Save"), button[type="submit"]').last();
    await saveButton.click();

    // 8. Attendi che la richiesta sia inviata (potrebbero esserci notifiche di successo)
    await page.waitForTimeout(2000);

    // 9. VERIFICA PRINCIPALE: Controlla se il modal è ancora visibile
    const isModalStillVisible = await modal.isVisible().catch(() => false);
    
    console.log('Modal ancora visibile dopo invio:', isModalStillVisible);

    // 10. Verifica se c'è il campo indirizzo ancora visibile
    const addressInput = page.locator('input[placeholder*="indirizzo"], input[placeholder*="address"], input[name*="address"]');
    const isAddressInputVisible = await addressInput.isVisible().catch(() => false);
    
    console.log('Campo indirizzo ancora visibile:', isAddressInputVisible);

    // 11. Fai uno screenshot per verificare visualmente
    await page.screenshot({ path: 'tests/screenshots/modal-after-submit.png', fullPage: true });

    // 12. Verifica che il modal sia ancora aperto
    await expect(modal).toBeVisible({ timeout: 5000 });
    
    // 13. Se il modal è visibile, prova a cercare il campo indirizzo
    if (isModalStillVisible) {
      const addressFields = await page.locator('input, textarea').allTextContents();
      console.log('Campi visibili nel modal:', addressFields);
      
      // Verifica che ci sia un campo indirizzo
      await expect(addressInput).toBeVisible();
    }
  });

  test('verifica chiusura modal con pulsante X o Annulla', async ({ page }) => {
    // Fai login usando il pulsante di accesso rapido
    const quickLoginButton = page.locator('button:has-text("Super Admin")');
    if (await quickLoginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await quickLoginButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Apri il modal
    const newRequestButton = page.locator('button:has-text("Nuova Richiesta"), button:has-text("New Request")');
    await newRequestButton.click();
    
    const modal = page.locator('[role="dialog"], .modal, div:has(button:has-text("Salva"))');
    await expect(modal).toBeVisible();

    // Cerca il pulsante di chiusura (X o Annulla)
    const closeButton = page.locator('button:has-text("Annulla"), button:has-text("Cancel"), button[aria-label*="close"], button:has(svg)').first();
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
      
      // Verifica che il modal si chiuda
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    }
  });
});
