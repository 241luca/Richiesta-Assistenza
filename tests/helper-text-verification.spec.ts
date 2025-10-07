import { test, expect } from '@playwright/test';

test.describe('Helper Text Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5193');
    
    // Login as client
    await page.fill('input[name="email"]', 'mario.rossi@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should display all helper texts in new request form', async ({ page }) => {
    // Navigate to new request page
    await page.click('text="Nuova Richiesta"');
    await page.waitForURL('**/requests/new');
    
    // Check helper texts are visible
    await expect(page.getByText('Descrivi in poche parole il problema principale')).toBeVisible();
    await expect(page.getByText('Includi: quando è iniziato il problema, frequenza, già tentate soluzioni')).toBeVisible();
    await expect(page.getByText('Scegli il tipo di professionista di cui hai bisogno')).toBeVisible();
    await expect(page.getByText('Dettaglio specifico del servizio richiesto')).toBeVisible();
    await expect(page.getByText('Indica quanto è urgente il tuo intervento')).toBeVisible();
    await expect(page.getByText('Seleziona quando preferisci ricevere l\'intervento (facoltativo)')).toBeVisible();
    await expect(page.getByText('Aggiungi dettagli su: accesso all\'abitazione, presenza animali, orari preferiti, parcheggio')).toBeVisible();
    
    // Check placeholders
    await expect(page.getByPlaceholder('Es: Perdita rubinetto cucina')).toBeVisible();
    await expect(page.getByPlaceholder(/Il rubinetto della cucina perde acqua/)).toBeVisible();
    
    // Check address helper texts
    await expect(page.getByText('Es: Via Roma, 10')).toBeVisible();
    await expect(page.getByText('Es: Milano, Roma, Napoli')).toBeVisible();
    await expect(page.getByText('Es: MI, RM, NA (2 lettere)')).toBeVisible();
    await expect(page.getByText('Es: 20100')).toBeVisible();
  });

  test('should display helper texts in edit request form', async ({ page }) => {
    // First create a request
    await page.click('text="Nuova Richiesta"');
    await page.waitForURL('**/requests/new');
    
    // Fill basic info
    await page.fill('input[placeholder*="Perdita rubinetto"]', 'Test richiesta helper text');
    await page.fill('textarea', 'Descrizione dettagliata per test helper text');
    
    // Select category
    await page.selectOption('select[id="categoryId"]', { index: 1 });
    
    // Fill address
    await page.fill('input[placeholder*="Via Roma"]', 'Via Test, 123');
    await page.fill('input[placeholder*="Milano"]', 'Milano');
    await page.fill('input[placeholder*="MI"]', 'MI');
    await page.fill('input[placeholder*="20100"]', '20100');
    
    // Submit
    await page.click('button:has-text("Crea Richiesta")');
    
    // Wait for redirect to request detail
    await page.waitForURL('**/requests/**');
    
    // Click edit button
    await page.click('text="Modifica"');
    await page.waitForURL('**/requests/**/edit');
    
    // Verify helper texts in edit page
    await expect(page.getByText('Descrivi in poche parole il problema principale')).toBeVisible();
    await expect(page.getByText('Includi: quando è iniziato il problema, frequenza, già tentate soluzioni')).toBeVisible();
    await expect(page.getByText('Scegli il tipo di professionista di cui hai bisogno')).toBeVisible();
    await expect(page.getByText('Indica quanto è urgente il tuo intervento')).toBeVisible();
  });
});
