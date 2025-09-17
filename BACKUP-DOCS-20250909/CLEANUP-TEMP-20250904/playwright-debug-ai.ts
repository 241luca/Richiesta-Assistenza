import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configurazione
const BASE_URL = 'http://localhost:5193';
const API_URL = 'http://localhost:3200';

// Credenziali admin (da sostituire con quelle reali)
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'Admin123!';

async function debugAISettings() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Starting AI Settings Debug with Playwright...\n');

    // 1. Avvia il browser
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500 // Rallenta per vedere cosa succede
    });
    page = await browser.newPage();

    // 2. Abilita i log della console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    // 3. Intercetta le richieste API per debug
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('📤 API Request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() !== 200) {
        console.log('📥 API Response Error:', response.status(), response.url());
      }
    });

    // 4. Vai alla pagina di login
    console.log('📍 Navigating to login page...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // 5. Effettua il login
    console.log('🔐 Attempting login...');
    
    // Cerca il form di login
    const emailInput = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = await page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill(ADMIN_EMAIL);
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      
      console.log('✅ Login form submitted');
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️ Login form not found, might already be logged in');
    }

    // 6. Naviga alle sottocategorie
    console.log('📍 Navigating to subcategories...');
    
    // Prova diversi modi per trovare il link
    const subcategoriesLink = await page.locator('a:has-text("Sottocategorie"), a[href*="subcategories"]').first();
    
    if (await subcategoriesLink.isVisible()) {
      await subcategoriesLink.click();
      await page.waitForTimeout(2000);
    } else {
      // Prova navigazione diretta
      await page.goto(`${BASE_URL}/admin/subcategories`);
      await page.waitForTimeout(2000);
    }

    // 7. Trova e clicca sul pulsante configurazione AI
    console.log('🔧 Looking for AI configuration button...');
    
    const configButton = await page.locator('button[title="Configurazione AI"], button:has(svg.text-purple-600)').first();
    
    if (await configButton.isVisible()) {
      console.log('✅ Found AI config button, clicking...');
      await configButton.click();
      await page.waitForTimeout(2000);
      
      // 8. Analizza il modal
      console.log('🔍 Analyzing AI settings modal...');
      
      // Controlla se il modal è aperto
      const modal = await page.locator('.fixed.inset-0, [role="dialog"]').first();
      
      if (await modal.isVisible()) {
        console.log('✅ Modal is open');
        
        // Trova il checkbox "Usa Knowledge Base"
        const kbCheckbox = await page.locator('input[id="useKnowledgeBase"]').first();
        
        if (await kbCheckbox.isVisible()) {
          console.log('📦 Enabling Knowledge Base...');
          await kbCheckbox.check();
          await page.waitForTimeout(1000);
          
          // Trova il pulsante upload
          const uploadButton = await page.locator('button:has-text("Upload File")').first();
          
          if (await uploadButton.isVisible()) {
            console.log('📤 Upload button found!');
            
            // Controlla se il pulsante è disabilitato
            const isDisabled = await uploadButton.isDisabled();
            console.log(`Button disabled: ${isDisabled}`);
            
            // Trova l'input file nascosto
            const fileInput = await page.locator('input[type="file"]').first();
            
            if (await fileInput.count() > 0) {
              console.log('✅ File input found');
              
              // Crea un file di test
              const testFilePath = path.join(process.cwd(), 'test-kb-document.txt');
              await fs.writeFile(testFilePath, 'Test Knowledge Base Document Content');
              
              // Imposta il file
              await fileInput.setInputFiles(testFilePath);
              console.log('📁 Test file set');
              
              await page.waitForTimeout(3000);
              
              // Pulisci il file di test
              await fs.unlink(testFilePath).catch(() => {});
            } else {
              console.log('❌ File input not found');
            }
          } else {
            console.log('❌ Upload button not found');
          }
        } else {
          console.log('❌ Knowledge Base checkbox not found');
        }
        
        // Prova a salvare le impostazioni
        console.log('💾 Attempting to save settings...');
        
        const saveButton = await page.locator('button:has-text("Salva"), button:has-text("Save")').last();
        
        if (await saveButton.isVisible()) {
          // Intercetta la risposta API
          const responsePromise = page.waitForResponse(
            response => response.url().includes('/ai-settings'),
            { timeout: 10000 }
          ).catch(err => {
            console.log('⚠️ No AI settings response intercepted');
            return null;
          });
          
          await saveButton.click();
          console.log('✅ Save button clicked');
          
          const response = await responsePromise;
          
          if (response) {
            const status = response.status();
            console.log(`📥 Save response status: ${status}`);
            
            if (status !== 200) {
              const body = await response.text();
              console.log('❌ Error response:', body);
            } else {
              console.log('✅ Settings saved successfully!');
            }
          }
        }
      } else {
        console.log('❌ Modal not visible');
      }
    } else {
      console.log('❌ AI configuration button not found');
      
      // Stampa cosa c'è nella pagina per debug
      const pageContent = await page.content();
      console.log('Page contains "Sottocategorie":', pageContent.includes('Sottocategorie'));
    }

    // 9. Analisi finale
    console.log('\n📊 Debug Analysis Complete');
    console.log('============================');
    
    // Mantieni il browser aperto per ispezione manuale
    console.log('\n⏸️ Browser will remain open for manual inspection.');
    console.log('Press Ctrl+C to exit...');
    
    // Aspetta indefinitamente
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    // Non chiudere il browser automaticamente per permettere ispezione
    // if (browser) await browser.close();
  }
}

// Esegui il debug
debugAISettings().catch(console.error);
