/**
 * E2E Test Suite - Authentication Flow
 * Test end-to-end del flusso di autenticazione
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5193';
const API_URL = 'http://localhost:3200';

// Test user credentials
const testUser = {
  email: 'e2e.test@example.com',
  password: 'E2EPassword123!',
  firstName: 'E2E',
  lastName: 'Test',
  phone: '3333333333',
  address: 'Via E2E 123',
  city: 'Milano',
  province: 'MI',
  postalCode: '20100'
};

test.describe('Authentication Flow', () => {
  
  test.beforeAll(async ({ request }) => {
    // Clean up test user if exists
    // This would typically be done via a test API endpoint
    console.log('Setting up test environment...');
  });

  test.afterAll(async ({ request }) => {
    // Clean up after tests
    console.log('Cleaning up test environment...');
  });

  test.describe('Registration', () => {
    
    test('should display registration form', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Click on register tab/link
      await page.click('text=Registrati');
      
      // Verify form fields are visible
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.click('text=Registrati');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Check for validation errors
      await expect(page.locator('text=Campo obbligatorio')).toBeVisible();
    });

    test('should register new user successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.click('text=Registrati');
      
      // Fill registration form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="firstName"]', testUser.firstName);
      await page.fill('input[name="lastName"]', testUser.lastName);
      await page.fill('input[name="phone"]', testUser.phone);
      await page.fill('input[name="address"]', testUser.address);
      await page.fill('input[name="city"]', testUser.city);
      await page.fill('input[name="province"]', testUser.province);
      await page.fill('input[name="postalCode"]', testUser.postalCode);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('Login', () => {
    
    test('should display login form', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Verify login form is visible by default
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Accedi")')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Enter invalid credentials
      await page.fill('input[name="email"]', 'wrong@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      
      // Submit
      await page.click('button:has-text("Accedi")');
      
      // Should show error message
      await expect(page.locator('text=Credenziali non valide')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Enter valid credentials
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      
      // Submit
      await page.click('button:has-text("Accedi")');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Should show user info
      await expect(page.locator(`text=${testUser.firstName}`)).toBeVisible();
    });

    test('should persist login on page refresh', async ({ page }) => {
      // First login
      await page.goto(`${BASE_URL}/auth`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Accedi")');
      
      // Wait for dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL(/.*dashboard/);
      await expect(page.locator(`text=${testUser.firstName}`)).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    
    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/auth`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Accedi")');
      
      // Wait for dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Click logout
      await page.click('button:has-text("Esci")');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*auth/);
      
      // Should not be able to access dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      await expect(page).toHaveURL(/.*auth/);
    });
  });

  test.describe('Protected Routes', () => {
    
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*auth/);
    });

    test('should allow access to protected route after login', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/auth`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Accedi")');
      
      // Should access dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Navigate to another protected route
      await page.goto(`${BASE_URL}/profile`);
      await expect(page).toHaveURL(/.*profile/);
    });
  });

  test.describe('WebSocket Connection', () => {
    
    test('should establish WebSocket connection after login', async ({ page }) => {
      // Login
      await page.goto(`${BASE_URL}/auth`);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button:has-text("Accedi")');
      
      // Wait for dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Check console for WebSocket connection
      const consoleMessages: string[] = [];
      page.on('console', msg => consoleMessages.push(msg.text()));
      
      // Wait a bit for WebSocket to connect
      await page.waitForTimeout(2000);
      
      // Check if WebSocket connected
      const hasConnected = consoleMessages.some(msg => 
        msg.includes('WebSocket connected') || msg.includes('Connected:')
      );
      
      expect(hasConnected).toBeTruthy();
    });
  });

  test.describe('Form Validation', () => {
    
    test('should validate email format', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Enter invalid email
      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="password"]', 'password123');
      
      // Try to submit
      await page.click('button:has-text("Accedi")');
      
      // Should show validation error
      await expect(page.locator('text=Email non valida')).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.click('text=Registrati');
      
      // Enter weak password
      await page.fill('input[name="password"]', '123');
      
      // Move to next field to trigger validation
      await page.click('input[name="email"]');
      
      // Should show password requirements
      await expect(page.locator('text=minimo 8 caratteri')).toBeVisible();
    });
  });

  test.describe('Password Reset', () => {
    
    test('should display forgot password link', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Should have forgot password link
      await expect(page.locator('text=Password dimenticata?')).toBeVisible();
    });

    test('should show password reset form', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      
      // Click forgot password
      await page.click('text=Password dimenticata?');
      
      // Should show reset form
      await expect(page.locator('text=Recupera Password')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('should submit password reset request', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth`);
      await page.click('text=Password dimenticata?');
      
      // Enter email
      await page.fill('input[name="email"]', testUser.email);
      
      // Submit
      await page.click('button:has-text("Invia")');
      
      // Should show success message
      await expect(page.locator('text=Email inviata')).toBeVisible();
    });
  });
});
