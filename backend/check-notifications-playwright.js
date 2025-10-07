const { chromium } = require('playwright');

async function checkNotificationsWithPlaywright() {
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 30000
  });
  
  try {
    console.log('🤖 CONTROLLO AUTOMATICO NOTIFICHE CON PLAYWRIGHT\n');
    console.log('=' .repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 1. Vai al login
    console.log('\n📱 Navigazione a http://localhost:5193/login...');
    await page.goto('http://localhost:5193/login');
    
    // 2. Fai login
    console.log('🔐 Eseguo login come SUPER_ADMIN...');
    
    // Compila email
    await page.fill('input[type="email"]', 'admin@assistenza.it');
    
    // Compila password
    await page.fill('input[type="password"]', 'Admin123!');
    
    // Clicca login
    await page.click('button[type="submit"]');
    
    // Aspetta navigazione
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login effettuato con successo!');
    
    // 3. Aspetta che la pagina sia completamente caricata
    await page.waitForTimeout(3000);
    
    // 4. Cerca icona notifiche
    console.log('\n🔔 Cerco icona notifiche...');
    
    // Metodo 1: Cerca per classe
    let bellIcon = await page.locator('svg[class*="BellIcon"], [data-testid="bell-icon"], button:has(svg path[d*="M14.857"])').first();
    
    if (await bellIcon.count() === 0) {
      // Metodo 2: Cerca per aria-label o title
      bellIcon = await page.locator('button:has-text("notif"), button[aria-label*="notif" i]').first();
    }
    
    if (await bellIcon.count() === 0) {
      // Metodo 3: Cerca nell'header
      bellIcon = await page.locator('header button:has(svg)').nth(0);
    }
    
    if (await bellIcon.count() > 0) {
      console.log('✅ Icona notifiche trovata!');
      
      // Cerca il badge numero
      const badge = await page.locator('.bg-red-500, .bg-red-600, [class*="badge"]').first();
      if (await badge.count() > 0) {
        const count = await badge.textContent();
        console.log(`📊 Notifiche non lette visibili: ${count}`);
      } else {
        console.log('📊 Nessun badge numero visibile');
      }
      
      // Clicca sull'icona
      await bellIcon.click();
      console.log('🖱️ Cliccato su icona notifiche');
      
      // Aspetta dropdown
      await page.waitForTimeout(1500);
      
      // Conta notifiche nel dropdown
      const notificationItems = await page.locator('.notification-item, [class*="border-b"], [role="menuitem"]').all();
      console.log(`\n📬 Notifiche nel dropdown: ${notificationItems.length}`);
      
      // Prendi il testo delle prime notifiche
      for (let i = 0; i < Math.min(3, notificationItems.length); i++) {
        const text = await notificationItems[i].textContent();
        console.log(`${i + 1}. ${text?.substring(0, 100)}...`);
      }
      
    } else {
      console.log('❌ Icona notifiche non trovata nell\'interfaccia');
    }
    
    // 5. Verifica via API nel browser
    console.log('\n🔍 Verifica diretta tramite API...');
    const apiData = await page.evaluate(async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return { error: 'No token found' };
      
      try {
        const response = await fetch('http://localhost:3200/api/notifications/unread', {
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        return {
          success: data.success,
          count: data.data?.length || 0,
          notifications: data.data?.slice(0, 3) || []
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📡 Risultato chiamata API:');
    if (apiData.error) {
      console.log('   ❌ Errore:', apiData.error);
    } else {
      console.log('   Success:', apiData.success);
      console.log('   Notifiche totali:', apiData.count);
      
      if (apiData.notifications.length > 0) {
        console.log('\n   Prime notifiche:');
        apiData.notifications.forEach((n, i) => {
          console.log(`   ${i + 1}. [${n.type}] ${n.title}`);
          console.log(`      ${n.content || n.message || 'No content'}`);
        });
      }
    }
    
    // 6. Screenshot
    await page.screenshot({ path: 'notifications-playwright.png' });
    console.log('\n📸 Screenshot salvato: notifications-playwright.png');
    
    // 7. Controlla console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ CONTROLLO COMPLETATO!');
    
    // Mantieni aperto per 5 secondi per vedere
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ ERRORE PLAYWRIGHT:', error);
  } finally {
    await browser.close();
  }
}

// Esegui
checkNotificationsWithPlaywright().catch(console.error);
