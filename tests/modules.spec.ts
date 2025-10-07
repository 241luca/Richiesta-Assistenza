/**
 * End-to-End Tests per Module Management
 * Test dell'interfaccia utente del sistema moduli
 * 
 * @author Sistema Richiesta Assistenza
 * @version 1.0.0
 * @updated 2025-10-06
 */

import { test, expect } from '@playwright/test';

test.describe('Module Management E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login come admin per accedere alle funzionalità moduli
    await page.goto('/login');
    
    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');
    
    // Compila il form di login
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    
    // Clicca il pulsante login
    await page.click('[data-testid="login-button"]');
    
    // Aspetta il redirect alla dashboard
    await page.waitForURL('/admin');
    
    // Verifica che siamo loggati
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  });

  test('should display all 66 modules with statistics', async ({ page }) => {
    // Naviga alla pagina moduli
    await page.goto('/admin/modules');
    
    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');

    // Verifica che il titolo sia visibile
    await expect(page.locator('h1')).toContainText('Gestione Moduli');

    // Verifica che le statistiche siano visibili
    const statsSection = page.locator('[data-testid="modules-stats"]');
    await expect(statsSection).toBeVisible();

    // Verifica il totale moduli (dovrebbe essere 66)
    const totalCard = page.locator('[data-testid="stat-total"]');
    await expect(totalCard).toBeVisible();
    await expect(totalCard.locator('[data-testid="stat-value"]')).toContainText('66');

    // Verifica che ci siano moduli abilitati
    const enabledCard = page.locator('[data-testid="stat-enabled"]');
    await expect(enabledCard).toBeVisible();
    
    // Verifica che i moduli core siano mostrati
    const coreCard = page.locator('[data-testid="stat-core"]');
    await expect(coreCard).toBeVisible();

    // Verifica che la lista moduli sia visibile
    const modulesList = page.locator('[data-testid="modules-list"]');
    await expect(modulesList).toBeVisible();

    // Verifica che ci siano delle card moduli
    const moduleCards = page.locator('[data-testid^="module-card-"]');
    await expect(moduleCards.first()).toBeVisible();
  });

  test('should filter modules by category', async ({ page }) => {
    await page.goto('/admin/modules');
    await page.waitForLoadState('networkidle');

    // Verifica che i filtri categoria siano visibili
    const categoryFilters = page.locator('[data-testid="category-filters"]');
    await expect(categoryFilters).toBeVisible();

    // Clicca sul filtro CORE
    await page.click('[data-testid="filter-CORE"]');
    
    // Aspetta che i risultati si aggiornino
    await page.waitForTimeout(1000);

    // Verifica che solo i moduli CORE siano visibili
    const moduleCards = page.locator('[data-testid^="module-card-"]');
    const coreModules = moduleCards.filter({
      has: page.locator('[data-testid="module-category"]', { hasText: 'CORE' })
    });
    
    // Dovremmo vedere solo moduli CORE
    await expect(coreModules.first()).toBeVisible();

    // Clicca sul filtro FEATURE
    await page.click('[data-testid="filter-FEATURE"]');
    await page.waitForTimeout(1000);

    // Verifica che ora vediamo moduli FEATURE
    const featureModules = moduleCards.filter({
      has: page.locator('[data-testid="module-category"]', { hasText: 'FEATURE' })
    });
    
    await expect(featureModules.first()).toBeVisible();

    // Reset filtri cliccando "Tutti"
    await page.click('[data-testid="filter-ALL"]');
    await page.waitForTimeout(1000);

    // Verifica che tutti i moduli siano di nuovo visibili
    await expect(moduleCards.first()).toBeVisible();
  });

  test('should enable and disable a non-core module', async ({ page }) => {
    await page.goto('/admin/modules');
    await page.waitForLoadState('networkidle');

    // Cerca il modulo Portfolio (non-core che può essere disabilitato)
    const portfolioCard = page.locator('[data-testid="module-card-portfolio"]');
    await expect(portfolioCard).toBeVisible();

    // Verifica che sia visibile lo switch toggle
    const toggle = portfolioCard.locator('[data-testid="module-toggle"]');
    await expect(toggle).toBeVisible();

    // Ottieni lo stato attuale (enabled/disabled)
    const isCurrentlyEnabled = await toggle.getAttribute('aria-checked') === 'true';

    // Clicca sul toggle per cambiare stato
    await toggle.click();

    // Aspetta che appaia il modal di conferma
    const confirmModal = page.locator('[data-testid="confirm-modal"]');
    await expect(confirmModal).toBeVisible();

    // Verifica che il modal abbia il titolo corretto
    const modalTitle = confirmModal.locator('[data-testid="modal-title"]');
    if (isCurrentlyEnabled) {
      await expect(modalTitle).toContainText('Disabilita Modulo');
    } else {
      await expect(modalTitle).toContainText('Abilita Modulo');
    }

    // Compila il campo motivo
    const reasonField = confirmModal.locator('[data-testid="reason-textarea"]');
    await reasonField.fill('Test E2E automatizzato');

    // Clicca conferma
    await confirmModal.locator('[data-testid="confirm-button"]').click();

    // Aspetta che il modal scompaia
    await expect(confirmModal).not.toBeVisible();

    // Aspetta che lo stato sia aggiornato (con un breve timeout)
    await page.waitForTimeout(2000);

    // Verifica che lo stato sia cambiato
    const newState = await toggle.getAttribute('aria-checked') === 'true';
    expect(newState).not.toBe(isCurrentlyEnabled);

    // Verifica che appaia un messaggio di successo
    const successMessage = page.locator('[data-testid="success-notification"]');
    await expect(successMessage).toBeVisible();
    
    if (!isCurrentlyEnabled) {
      await expect(successMessage).toContainText('abilitato');
    } else {
      await expect(successMessage).toContainText('disabilitato');
    }
  });

  test('should NOT allow disabling CORE modules', async ({ page }) => {
    await page.goto('/admin/modules');
    await page.waitForLoadState('networkidle');

    // Filtra per moduli CORE
    await page.click('[data-testid="filter-CORE"]');
    await page.waitForTimeout(1000);

    // Trova un modulo CORE (es. auth)
    const coreModule = page.locator('[data-testid="module-card-auth"]');
    await expect(coreModule).toBeVisible();

    // Verifica che il badge CORE sia visibile
    const coreBadge = coreModule.locator('[data-testid="core-badge"]');
    await expect(coreBadge).toBeVisible();
    await expect(coreBadge).toContainText('CORE');

    // Verifica che il toggle sia disabilitato
    const toggle = coreModule.locator('[data-testid="module-toggle"]');
    await expect(toggle).toBeDisabled();

    // Verifica tooltip informativo quando si hovera
    await toggle.hover();
    const tooltip = page.locator('[data-testid="core-module-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('I moduli core non possono essere disabilitati');
  });

  test('should search modules by name and description', async ({ page }) => {
    await page.goto('/admin/modules');
    await page.waitForLoadState('networkidle');

    // Trova il campo di ricerca
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    // Cerca "whatsapp"
    await searchInput.fill('whatsapp');
    
    // Aspetta che i risultati si aggiornino
    await page.waitForTimeout(1000);

    // Verifica che solo i moduli contenenti "whatsapp" siano visibili
    const moduleCards = page.locator('[data-testid^="module-card-"]');
    const visibleCards = moduleCards.filter({ hasText: /whatsapp/i });
    
    await expect(visibleCards.first()).toBeVisible();

    // Verifica che i moduli non correlati non siano visibili
    const authCard = page.locator('[data-testid="module-card-auth"]');
    await expect(authCard).not.toBeVisible();

    // Pulisci la ricerca
    await searchInput.clear();
    await page.waitForTimeout(1000);

    // Verifica che tutti i moduli tornino visibili
    await expect(authCard).toBeVisible();
  });

  test('should show module details modal', async ({ page }) => {
    await page.goto('/admin/modules');
    await page.waitForLoadState('networkidle');

    // Trova e clicca su un modulo specifico
    const reviewsCard = page.locator('[data-testid="module-card-reviews"]');
    await expect(reviewsCard).toBeVisible();

    // Clicca sul pulsante "Dettagli" o sull'icona info
    await reviewsCard.locator('[data-testid="module-details-button"]').click();

    // Aspetta che appaia il modal dettagli
    const detailsModal = page.locator('[data-testid="module-details-modal"]');
    await expect(detailsModal).toBeVisible();

    // Verifica contenuto del modal
    await expect(detailsModal.locator('[data-testid="module-name"]')).toContainText('Recensioni');
    await expect(detailsModal.locator('[data-testid="module-description"]')).toBeVisible();
    await expect(detailsModal.locator('[data-testid="module-category"]')).toBeVisible();
    
    // Verifica tab settings se presente
    const settingsTab = detailsModal.locator('[data-testid="tab-settings"]');
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await expect(detailsModal.locator('[data-testid="settings-list"]')).toBeVisible();
    }

    // Verifica tab history
    const historyTab = detailsModal.locator('[data-testid="tab-history"]');
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await expect(detailsModal.locator('[data-testid="history-list"]')).toBeVisible();
    }

    // Chiudi il modal
    await detailsModal.locator('[data-testid="close-button"]').click();
    await expect(detailsModal).not.toBeVisible();
  });

  test('dashboard widget should show module statistics', async ({ page }) => {
    // Va alla dashboard principale admin
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verifica che il widget stato moduli sia presente
    const modulesWidget = page.locator('[data-testid="modules-status-widget"]');
    await expect(modulesWidget).toBeVisible();

    // Verifica contenuto del widget
    await expect(modulesWidget.locator('[data-testid="widget-title"]')).toContainText('Stato Moduli');
    
    // Verifica statistiche rapide
    await expect(modulesWidget.locator('[data-testid="modules-total"]')).toBeVisible();
    await expect(modulesWidget.locator('[data-testid="modules-enabled"]')).toBeVisible();
    await expect(modulesWidget.locator('[data-testid="modules-disabled"]')).toBeVisible();

    // Clicca sul link "Gestisci" per andare alla pagina moduli
    await modulesWidget.locator('[data-testid="manage-modules-link"]').click();
    
    // Verifica redirect alla pagina gestione moduli
    await expect(page).toHaveURL('/admin/modules');
    await expect(page.locator('h1')).toContainText('Gestione Moduli');
  });

  test('should show dependency validation warnings', async ({ page }) => {
    await page.goto('/admin/modules');
    await page.waitForLoadState('networkidle');

    // Cerca il pulsante o sezione validazione dipendenze
    const validateButton = page.locator('[data-testid="validate-dependencies-button"]');
    
    if (await validateButton.isVisible()) {
      await validateButton.click();
      
      // Aspetta che appaia il risultato della validazione
      const validationResults = page.locator('[data-testid="validation-results"]');
      await expect(validationResults).toBeVisible();
      
      // Verifica che mostri se ci sono errori o warning
      const validationStatus = validationResults.locator('[data-testid="validation-status"]');
      await expect(validationStatus).toBeVisible();
      
      // Se ci sono errori, dovrebbero essere listati
      const errorsList = validationResults.locator('[data-testid="validation-errors"]');
      const warningsList = validationResults.locator('[data-testid="validation-warnings"]');
      
      // Almeno uno dovrebbe essere visibile (errori o warnings)
      const hasErrors = await errorsList.isVisible();
      const hasWarnings = await warningsList.isVisible();
      
      expect(hasErrors || hasWarnings).toBeTruthy();
    }
  });

  test('should handle loading states correctly', async ({ page }) => {
    await page.goto('/admin/modules');
    
    // Durante il caricamento dovremmo vedere dei skeleton loaders
    const loadingSkeletons = page.locator('[data-testid="loading-skeleton"]');
    
    // Potrebbero essere visibili brevemente
    if (await loadingSkeletons.first().isVisible({ timeout: 1000 })) {
      await expect(loadingSkeletons.first()).toBeVisible();
    }
    
    // Aspetta che il caricamento finisca
    await page.waitForLoadState('networkidle');
    
    // I skeleton dovrebbero essere scomparsi
    await expect(loadingSkeletons.first()).not.toBeVisible();
    
    // E i contenuti reali dovrebbero essere visibili
    await expect(page.locator('[data-testid="modules-list"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simula un errore di rete intercettando le richieste API
    await page.route('/api/admin/modules', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: { code: 'FETCH_ERROR' }
        })
      });
    });

    await page.goto('/admin/modules');
    await page.waitForLoadState('networkidle');

    // Dovrebbe mostrare un messaggio di errore
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Errore nel caricamento');

    // Dovrebbe esserci un pulsante "Riprova"
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();

    // Il contenuto principale non dovrebbe essere visibile
    const modulesList = page.locator('[data-testid="modules-list"]');
    await expect(modulesList).not.toBeVisible();
  });
});
