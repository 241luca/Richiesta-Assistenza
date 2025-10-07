import puppeteer from 'puppeteer';

async function checkNotificationsAutomatically() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    console.log('🤖 CONTROLLO AUTOMATICO NOTIFICHE SUPER_ADMIN\n');
    console.log('=' .repeat(50));
    
    const page = await browser.newPage();
    
    // 1. Vai alla pagina di login
    console.log('\n📱 Navigazione a http://localhost:5193...');
    await page.goto('http://localhost:5193', { waitUntil: 'networkidle2' });
    
    // 2. Verifica se siamo già loggati o dobbiamo fare login
    const isLoggedIn = await page.evaluate(() => {
      return !!localStorage.getItem('accessToken');
    });
    
    if (!isLoggedIn) {
      console.log('🔐 Login necessario...');
      
      // Compila form di login
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.type('input[type="email"]', 'admin@assistenza.it');
      await page.type('input[type="password"]', 'Admin123!');
      
      // Clicca login
      await page.click('button[type="submit"]');
      
      // Aspetta redirect alla dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Login effettuato con successo!');
    } else {
      console.log('✅ Già loggato come SUPER_ADMIN');
    }
    
    // 3. Aspetta che la pagina sia caricata
    await page.waitForTimeout(2000);
    
    // 4. Cerca l'icona delle notifiche
    console.log('\n🔔 Ricerca icona notifiche...');
    
    // Prova a trovare l'icona campanello
    const bellIcon = await page.$('[class*="BellIcon"]');
    if (bellIcon) {
      console.log('✅ Icona notifiche trovata!');
      
      // Cerca il badge con il numero
      const notificationCount = await page.evaluate(() => {
        const badge = document.querySelector('[class*="bg-red-500"]');
        return badge ? badge.textContent : '0';
      });
      
      console.log(`📊 Notifiche non lette: ${notificationCount}`);
      
      // Clicca sull'icona
      await bellIcon.click();
      console.log('🖱️ Cliccato su icona notifiche');
      
      // Aspetta che il dropdown si apra
      await page.waitForTimeout(1000);
      
      // Conta le notifiche nel dropdown
      const notifications = await page.evaluate(() => {
        const items = document.querySelectorAll('[class*="notification-item"], [class*="p-3 border-b"]');
        return Array.from(items).map(item => ({
          title: item.querySelector('h4, [class*="font-semibold"]')?.textContent,
          content: item.querySelector('p, [class*="text-sm"]')?.textContent
        }));
      });
      
      console.log(`\n📬 Notifiche trovate nel dropdown: ${notifications.length}`);
      notifications.forEach((n, i) => {
        console.log(`${i + 1}. ${n.title || 'Senza titolo'}`);
        console.log(`   ${n.content || 'Senza contenuto'}`);
      });
      
    } else {
      console.log('❌ Icona notifiche non trovata!');
    }
    
    // 5. Chiama l'API direttamente per verificare
    console.log('\n🔍 Verifica diretta via API...');
    const apiResponse = await page.evaluate(async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3200/api/notifications/unread', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      return await response.json();
    });
    
    console.log('📡 Risposta API:');
    console.log('   Success:', apiResponse.success);
    console.log('   Notifiche:', apiResponse.data?.length || 0);
    
    if (apiResponse.data && apiResponse.data.length > 0) {
      console.log('\n📋 NOTIFICHE DALL\'API:');
      apiResponse.data.slice(0, 5).forEach((n, i) => {
        console.log(`${i + 1}. [${n.type}] ${n.title}`);
        console.log(`   ${n.content}`);
      });
    }
    
    // 6. Screenshot finale
    console.log('\n📸 Screenshot salvato come notifications-check.png');
    await page.screenshot({ path: 'notifications-check.png', fullPage: false });
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ CONTROLLO COMPLETATO!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await browser.close();
  }
}

// Esegui
checkNotificationsAutomatically();
