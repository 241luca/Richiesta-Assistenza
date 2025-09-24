#!/usr/bin/env node

/**
 * VERIFICA REALE STATO WHATSAPP
 * Script di diagnostica per verificare con certezza lo stato di WPPConnect
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

console.log('=========================================');
console.log('  🔍 DIAGNOSI SISTEMA WHATSAPP');
console.log('=========================================\n');

// 1. Verifica se ci sono sessioni WPPConnect salvate
console.log('1️⃣ CONTROLLO SESSIONI SALVATE');
console.log('--------------------------------');

const tokensPath = path.join(__dirname, 'backend', 'tokens');
const wppSessionPath = path.join(__dirname, 'backend', '.wppconnect');

// Controlla cartella tokens
if (fs.existsSync(tokensPath)) {
    console.log('📁 Cartella tokens trovata:', tokensPath);
    const files = fs.readdirSync(tokensPath);
    if (files.length > 0) {
        console.log('   Files trovati:', files);
    } else {
        console.log('   ❌ Cartella vuota - NESSUNA SESSIONE SALVATA');
    }
} else {
    console.log('❌ Cartella tokens NON ESISTE - Mai connesso');
}

// Controlla cartella .wppconnect
if (fs.existsSync(wppSessionPath)) {
    console.log('📁 Cartella .wppconnect trovata:', wppSessionPath);
    const sessions = fs.readdirSync(wppSessionPath);
    if (sessions.length > 0) {
        console.log('   Sessioni trovate:', sessions);
        
        // Verifica data ultima modifica
        sessions.forEach(session => {
            const sessionPath = path.join(wppSessionPath, session);
            const stats = fs.statSync(sessionPath);
            const lastModified = new Date(stats.mtime);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastModified) / 1000 / 60);
            
            console.log(`   📅 ${session}: Ultima modifica ${diffMinutes} minuti fa`);
            
            if (diffMinutes > 30) {
                console.log('      ⚠️ SESSIONE PROBABILMENTE SCADUTA');
            }
        });
    } else {
        console.log('   ❌ Nessuna sessione trovata');
    }
} else {
    console.log('❌ Cartella .wppconnect NON ESISTE - WPPConnect mai inizializzato');
}

// 2. Verifica processi Chrome/Chromium attivi
console.log('\n2️⃣ CONTROLLO BROWSER HEADLESS');
console.log('--------------------------------');

const { execSync } = require('child_process');

try {
    // Cerca processi Chrome avviati da WPPConnect
    const chromiumProcesses = execSync('ps aux | grep -i chromium | grep -v grep').toString();
    const chromeProcesses = execSync('ps aux | grep -i "chrome.*headless" | grep -v grep').toString();
    
    if (chromiumProcesses || chromeProcesses) {
        console.log('✅ Browser headless TROVATO in esecuzione');
        if (chromiumProcesses) {
            const lines = chromiumProcesses.split('\n').filter(l => l.trim());
            console.log(`   Processi Chromium: ${lines.length}`);
        }
        if (chromeProcesses) {
            const lines = chromeProcesses.split('\n').filter(l => l.trim());
            console.log(`   Processi Chrome: ${lines.length}`);
        }
    } else {
        console.log('❌ NESSUN browser headless in esecuzione');
        console.log('   WhatsApp NON PUÒ essere connesso');
    }
} catch (e) {
    console.log('❌ Nessun processo browser trovato - WhatsApp NON connesso');
}

// 3. Verifica API backend
console.log('\n3️⃣ VERIFICA API BACKEND');
console.log('--------------------------------');

async function checkAPI() {
    try {
        // Prima facciamo login
        console.log('🔐 Login al sistema...');
        const loginResponse = await axios.post('http://localhost:3200/api/auth/login', {
            email: 'admin@test.com',
            password: 'Admin123!@#'
        });
        
        const token = loginResponse.data.data.token;
        console.log('✅ Login riuscito');
        
        // Verifica stato WhatsApp
        console.log('\n📱 Verifica stato WhatsApp via API...');
        const statusResponse = await axios.get('http://localhost:3200/api/whatsapp/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const status = statusResponse.data.data;
        console.log('   Provider:', status.provider);
        console.log('   Connected:', status.connected ? '✅ SI' : '❌ NO');
        console.log('   Message:', status.message);
        
        if (status.qrCode) {
            console.log('   QR Code:', status.qrCode ? 'DISPONIBILE' : 'NON DISPONIBILE');
        }
        
        // Verifica statistiche
        console.log('\n📊 Statistiche dal database:');
        const statsResponse = await axios.get('http://localhost:3200/api/whatsapp/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const stats = statsResponse.data.data;
        console.log('   Messaggi totali:', stats.totalMessages);
        console.log('   Messaggi oggi:', stats.todayMessages);
        console.log('   Connesso:', stats.isConnected ? '✅ SI' : '❌ NO');
        
        if (stats.connectedSince) {
            console.log('   Ultima connessione:', new Date(stats.connectedSince).toLocaleString());
        }
        
    } catch (error) {
        console.log('❌ Errore verifica API:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
    }
}

// 4. Verifica database direttamente
console.log('\n4️⃣ CONTROLLO DATABASE');
console.log('--------------------------------');

async function checkDatabase() {
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Conta messaggi
        const messageCount = await prisma.whatsAppMessage.count();
        console.log('📬 Messaggi totali nel DB:', messageCount);
        
        // Ultimo messaggio
        const lastMessage = await prisma.whatsAppMessage.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        if (lastMessage) {
            const diffMinutes = Math.floor((new Date() - new Date(lastMessage.createdAt)) / 1000 / 60);
            console.log(`   Ultimo messaggio: ${diffMinutes} minuti fa`);
            console.log(`   Direzione: ${lastMessage.direction}`);
            console.log(`   Numero: ${lastMessage.phoneNumber}`);
        } else {
            console.log('   ❌ Nessun messaggio nel database');
        }
        
        // Verifica SystemSettings
        const wppSetting = await prisma.systemSetting.findFirst({
            where: { key: 'wpp_connected_at' }
        });
        
        if (wppSetting) {
            console.log('\n🔧 Settings WhatsApp:');
            console.log('   Connected at:', wppSetting.value);
            const connectedDate = new Date(wppSetting.value);
            const diffHours = Math.floor((new Date() - connectedDate) / 1000 / 60 / 60);
            console.log(`   ${diffHours} ore fa`);
        }
        
        await prisma.$disconnect();
        
    } catch (error) {
        console.log('❌ Errore accesso database:', error.message);
    }
}

// 5. Verifica log recenti
console.log('\n5️⃣ LOG RECENTI');
console.log('--------------------------------');

const logsPath = path.join(__dirname, 'backend', 'logs', 'combined.log');
if (fs.existsSync(logsPath)) {
    const logs = fs.readFileSync(logsPath, 'utf-8');
    const lines = logs.split('\n');
    const recentLines = lines.slice(-20); // Ultimi 20 log
    
    console.log('Ultimi log relativi a WhatsApp:');
    recentLines.forEach(line => {
        if (line.toLowerCase().includes('whatsapp') || 
            line.toLowerCase().includes('wpp') ||
            line.includes('CONNECTED') ||
            line.includes('QR')) {
            console.log('   ', line.substring(0, 150));
        }
    });
} else {
    console.log('❌ File log non trovato');
}

// Esegui tutti i controlli
async function runDiagnostics() {
    await checkAPI();
    await checkDatabase();
    
    console.log('\n=========================================');
    console.log('  📋 VERDETTO FINALE');
    console.log('=========================================');
    
    // Analizza i risultati
    const hasTokens = fs.existsSync(tokensPath) && fs.readdirSync(tokensPath).length > 0;
    const hasWppSession = fs.existsSync(wppSessionPath) && fs.readdirSync(wppSessionPath).length > 0;
    
    let browserRunning = false;
    try {
        execSync('ps aux | grep -i "chrom" | grep -v grep');
        browserRunning = true;
    } catch (e) {}
    
    if (!hasTokens && !hasWppSession && !browserRunning) {
        console.log('❌ WHATSAPP SICURAMENTE NON CONNESSO');
        console.log('   - Nessuna sessione salvata');
        console.log('   - Nessun browser in esecuzione');
        console.log('   - Necessario nuovo QR code');
    } else if (hasTokens || hasWppSession) {
        if (browserRunning) {
            console.log('⚠️ STATO INCERTO');
            console.log('   - Sessione trovata ma potrebbe essere scaduta');
            console.log('   - Browser in esecuzione');
            console.log('   - Verificare con QR code');
        } else {
            console.log('❌ WHATSAPP DISCONNESSO');
            console.log('   - Sessione vecchia trovata ma browser non attivo');
            console.log('   - Necessaria riconnessione');
        }
    }
    
    console.log('\n🔧 AZIONI CONSIGLIATE:');
    console.log('1. Vai su http://localhost:5193/admin/whatsapp');
    console.log('2. Clicca "Genera QR Code"');
    console.log('3. Scansiona con WhatsApp');
    console.log('4. Attendi conferma connessione');
    console.log('5. Testa invio messaggio');
}

// Avvia diagnostica
runDiagnostics().catch(console.error);
