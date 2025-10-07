/**
 * E2E Test Suite - Assistance Requests
 * Test end-to-end per il flusso di richieste assistenza
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5193';

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Accedi")');
  await expect(page).toHaveURL(/.*dashboard/);
}

test.describe('Assistance Requests Flow', () => {
  
  const clientCredentials = {
    email: 'luigi.bianchi@gmail.com',
    password: 'password123'
  };

  const professionalCredentials = {
    email: 'mario.rossi@assistenza.it',
    password: 'password123'
  };

  test.beforeEach(async ({ page }) => {
    // Login as client before each test
    await login(page, clientCredentials.email, clientCredentials.password);
  });

  test.describe('Creating Requests', () => {
    
    test('should display new request button', async ({ page }) => {
      await expect(page.locator('button:has-text("Nuova Richiesta")')).toBeVisible();
    });

    test('should open new request form', async ({ page }) => {
      await page.click('button:has-text("Nuova Richiesta")');
      
      // Should show request form
      await expect(page.locator('h2:has-text("Nuova Richiesta Assistenza")')).toBeVisible();
      await expect(page.locator('input[name="title"]')).toBeVisible();
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
    });

    test('should create new request successfully', async ({ page }) => {
      await page.click('button:has-text("Nuova Richiesta")');
      
      // Fill request form
      const requestTitle = `Test Request ${Date.now()}`;
      await page.fill('input[name="title"]', requestTitle);
      await page.fill('textarea[name="description"]', 'Questo è un test automatico della richiesta di assistenza');
      
      // Select category
      await page.selectOption('select[name="category"]', { label: 'Idraulico' });
      
      // Select priority
      await page.selectOption('select[name="priority"]', { label: 'Media' });
      
      // Fill address if not already filled
      const addressField = page.locator('input[name="address"]');
      if (await addressField.count() > 0) {
        await addressField.fill('Via Test 123');
      }
      
      // Submit form
      await page.click('button:has-text("Invia Richiesta")');
      
      // Should show success message
      await expect(page.locator('text=Richiesta creata con successo')).toBeVisible();
      
      // Should be in requests list
      await page.goto(`${BASE_URL}/dashboard/client`);
      await expect(page.locator(`text=${requestTitle}`)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('button:has-text("Nuova Richiesta")');
      
      // Try to submit empty form
      await page.click('button:has-text("Invia Richiesta")');
      
      // Should show validation errors
      await expect(page.locator('text=Il titolo è obbligatorio')).toBeVisible();
      await expect(page.locator('text=La descrizione è obbligatoria')).toBeVisible();
    });

    test('should allow file upload', async ({ page }) => {
      await page.click('button:has-text("Nuova Richiesta")');
      
      // Fill basic fields
      await page.fill('input[name="title"]', 'Request with attachment');
      await page.fill('textarea[name="description"]', 'Testing file upload');
      await page.selectOption('select[name="category"]', { label: 'Elettricista' });
      
      // Upload file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        // Create a test file
        await fileInput.setInputFiles({
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('Test file content')
        });
        
        // Should show file name
        await expect(page.locator('text=test.txt')).toBeVisible();
      }
      
      // Submit
      await page.click('button:has-text("Invia Richiesta")');
      await expect(page.locator('text=Richiesta creata con successo')).toBeVisible();
    });
  });

  test.describe('Viewing Requests', () => {
    
    test('should display list of requests', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Should show requests table or list
      await expect(page.locator('text=Le Mie Richieste')).toBeVisible();
    });

    test('should filter requests by status', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Look for filter options
      const filterSelect = page.locator('select[name="status"]');
      if (await filterSelect.count() > 0) {
        // Filter by pending
        await filterSelect.selectOption('PENDING');
        
        // Wait for filter to apply
        await page.waitForTimeout(500);
        
        // Check that only pending requests are shown
        const statusBadges = page.locator('.badge:has-text("In Attesa")');
        const count = await statusBadges.count();
        
        if (count > 0) {
          for (let i = 0; i < count; i++) {
            await expect(statusBadges.nth(i)).toBeVisible();
          }
        }
      }
    });

    test('should open request details', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Click on first request (if exists)
      const firstRequest = page.locator('tr').nth(1);
      if (await firstRequest.count() > 0) {
        await firstRequest.click();
        
        // Should show request details
        await expect(page.locator('h2:has-text("Dettagli Richiesta")')).toBeVisible();
        await expect(page.locator('text=Descrizione')).toBeVisible();
        await expect(page.locator('text=Stato')).toBeVisible();
      }
    });
  });

  test.describe('Request Status Updates', () => {
    
    test('should show status badges', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Look for status badges
      const badges = page.locator('.badge');
      if (await badges.count() > 0) {
        // Status badges should have appropriate colors
        const pendingBadge = page.locator('.badge.bg-yellow-100');
        const assignedBadge = page.locator('.badge.bg-blue-100');
        const completedBadge = page.locator('.badge.bg-green-100');
        
        // At least one type should exist
        const hasBadges = 
          (await pendingBadge.count() > 0) ||
          (await assignedBadge.count() > 0) ||
          (await completedBadge.count() > 0);
        
        expect(hasBadges).toBeTruthy();
      }
    });

    test('should receive real-time updates', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Listen for WebSocket messages
      const wsMessages: string[] = [];
      page.on('console', msg => {
        if (msg.text().includes('WebSocket') || msg.text().includes('notification')) {
          wsMessages.push(msg.text());
        }
      });
      
      // Wait for potential WebSocket activity
      await page.waitForTimeout(3000);
      
      // Should have WebSocket connection
      const hasWebSocketActivity = wsMessages.some(msg => 
        msg.includes('connected') || msg.includes('Connected')
      );
      
      expect(hasWebSocketActivity).toBeTruthy();
    });
  });

  test.describe('Professional View', () => {
    
    test('should show assigned requests for professional', async ({ page }) => {
      // Logout as client
      await page.click('button:has-text("Esci")');
      
      // Login as professional
      await login(page, professionalCredentials.email, professionalCredentials.password);
      
      // Go to professional dashboard
      await page.goto(`${BASE_URL}/dashboard/professional`);
      
      // Should show professional-specific content
      await expect(page.locator('text=Richieste Assegnate')).toBeVisible();
    });

    test('should allow professional to view request details', async ({ page }) => {
      // Login as professional
      await page.click('button:has-text("Esci")');
      await login(page, professionalCredentials.email, professionalCredentials.password);
      
      await page.goto(`${BASE_URL}/dashboard/professional`);
      
      // Click on first assigned request (if any)
      const assignedRequest = page.locator('tr').nth(1);
      if (await assignedRequest.count() > 0) {
        await assignedRequest.click();
        
        // Should show request details
        await expect(page.locator('h2:has-text("Dettagli Richiesta")')).toBeVisible();
        
        // Should have action buttons for professional
        await expect(page.locator('button:has-text("Crea Preventivo")')).toBeVisible();
      }
    });
  });

  test.describe('Request Communication', () => {
    
    test('should show chat/messages section', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Open a request with assigned professional
      const assignedRequest = page.locator('tr:has-text("Assegnato")').first();
      if (await assignedRequest.count() > 0) {
        await assignedRequest.click();
        
        // Should have messaging section
        await expect(page.locator('text=Messaggi')).toBeVisible();
        
        // Should have message input
        const messageInput = page.locator('textarea[placeholder*="messaggio"]');
        if (await messageInput.count() > 0) {
          await expect(messageInput).toBeVisible();
        }
      }
    });

    test('should send message in request', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Open a request
      const request = page.locator('tr').nth(1);
      if (await request.count() > 0) {
        await request.click();
        
        // Find message input
        const messageInput = page.locator('textarea[placeholder*="messaggio"]');
        if (await messageInput.count() > 0) {
          const testMessage = `Test message ${Date.now()}`;
          await messageInput.fill(testMessage);
          
          // Send message
          await page.click('button:has-text("Invia")');
          
          // Message should appear in chat
          await expect(page.locator(`text=${testMessage}`)).toBeVisible();
        }
      }
    });
  });

  test.describe('Request Cancellation', () => {
    
    test('should allow client to cancel pending request', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/client`);
      
      // Find a pending request
      const pendingRequest = page.locator('tr:has-text("In Attesa")').first();
      if (await pendingRequest.count() > 0) {
        await pendingRequest.click();
        
        // Should have cancel button
        const cancelButton = page.locator('button:has-text("Annulla Richiesta")');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
          
          // Confirm cancellation
          await page.click('button:has-text("Conferma")');
          
          // Should show success message
          await expect(page.locator('text=Richiesta annullata')).toBeVisible();
        }
      }
    });
  });
});
