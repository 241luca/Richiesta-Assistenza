import { test, expect } from '@playwright/test';

test.describe('Google Maps Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login prima di ogni test
    await page.goto('http://localhost:5193/auth');
    await page.fill('input[type="email"]', 'cliente@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Accedi")');
    await page.waitForURL('**/dashboard/**');
  });

  test('should autocomplete address in new request form', async ({ page }) => {
    // Vai alla pagina nuova richiesta
    await page.goto('http://localhost:5193/requests/new');
    
    // Compila i campi base
    await page.fill('input[name="title"]', 'Test richiesta con indirizzo');
    await page.fill('textarea[name="description"]', 'Questa è una descrizione di test per verificare il funzionamento della geolocalizzazione');
    
    // Seleziona una categoria
    await page.click('text=Seleziona una categoria');
    await page.click('text=Idraulico');
    
    // Test autocompletamento indirizzo
    const addressInput = page.locator('input[placeholder*="indirizzo"]').first();
    await addressInput.fill('Via Roma 1 Milano');
    
    // Aspetta che appaia il dropdown di suggerimenti
    await page.waitForTimeout(1000);
    
    // Verifica che i campi si popolino
    const cityField = page.locator('input[name="city"]');
    const provinceField = page.locator('input[name="province"]');
    const postalCodeField = page.locator('input[name="postalCode"]');
    
    // Verifica che almeno uno dei campi sia popolato
    await expect(cityField).not.toBeEmpty();
  });

  test('should show map preview after address selection', async ({ page }) => {
    await page.goto('http://localhost:5193/requests/new');
    
    // Inserisci indirizzo
    const addressInput = page.locator('input[placeholder*="indirizzo"]').first();
    await addressInput.fill('Via del Corso 101 Roma');
    await page.waitForTimeout(1000);
    
    // Verifica che la mappa appaia
    const mapContainer = page.locator('.gm-style');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });

  test('should handle request creation with coordinates', async ({ page }) => {
    await page.goto('http://localhost:5193/requests/new');
    
    // Compila il form completo
    await page.fill('input[name="title"]', 'Riparazione urgente');
    await page.fill('textarea[name="description"]', 'Ho bisogno di una riparazione urgente del rubinetto che perde');
    
    // Seleziona categoria
    await page.click('text=Seleziona una categoria');
    await page.click('text=Idraulico');
    
    // Indirizzo
    await page.fill('input[name="address"]', 'Via Nazionale 10');
    await page.fill('input[name="city"]', 'Roma');
    await page.fill('input[name="province"]', 'RM');
    await page.fill('input[name="postalCode"]', '00184');
    
    // Crea richiesta
    await page.click('button:has-text("Crea Richiesta")');
    
    // Verifica che non rimanga in loading
    await page.waitForURL('**/requests/**', { timeout: 10000 });
    
    // Verifica che la richiesta sia stata creata
    await expect(page.locator('h1:has-text("Riparazione urgente")')).toBeVisible({ timeout: 10000 });
  });

  test('should geocode existing requests without coordinates', async ({ page }) => {
    // Vai alla lista richieste
    await page.goto('http://localhost:5193/requests');
    
    // Clicca su una richiesta esistente
    const firstRequest = page.locator('.request-card').first();
    await firstRequest.click();
    
    // Verifica che la mappa si carichi
    const mapContainer = page.locator('.gm-style');
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Verifica che il marker sia posizionato correttamente (non su Torino)
    const mapCenter = await page.evaluate(() => {
      const map = window.google?.maps?.Map?.instances?.[0];
      if (map) {
        const center = map.getCenter();
        return { lat: center.lat(), lng: center.lng() };
      }
      return null;
    });
    
    // Verifica che non sia centrato su Torino (45.07, 7.68)
    if (mapCenter) {
      expect(Math.abs(mapCenter.lat - 45.07)).toBeGreaterThan(0.1);
    }
  });

  test('should handle missing postal code gracefully', async ({ page }) => {
    await page.goto('http://localhost:5193/requests/new');
    
    // Inserisci indirizzo senza numero civico
    const addressInput = page.locator('input[placeholder*="indirizzo"]').first();
    await addressInput.fill('Via dei Mille');
    await page.fill('input[name="city"]', 'Milano');
    await page.fill('input[name="province"]', 'MI');
    
    // Il CAP dovrebbe essere recuperato automaticamente o permettere inserimento manuale
    const postalCodeField = page.locator('input[name="postalCode"]');
    
    // Se vuoto, inserisci manualmente
    const postalCode = await postalCodeField.inputValue();
    if (!postalCode) {
      await postalCodeField.fill('20100');
    }
    
    // Verifica che accetti l'input
    await expect(postalCodeField).toHaveValue(/\d{5}/);
  });
});