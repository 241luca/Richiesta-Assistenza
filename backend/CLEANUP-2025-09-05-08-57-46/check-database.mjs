#!/usr/bin/env node

/**
 * Script per verificare lo stato del database e creare utenti di test
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Colori per output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

async function checkDatabase() {
    console.log(`${colors.cyan}${'='.repeat(60)}`);
    console.log(`${colors.cyan}     VERIFICA DATABASE - RICHIESTA ASSISTENZA`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
    
    try {
        // 1. Conta utenti per ruolo
        console.log(`${colors.blue}📊 Utenti nel database:${colors.reset}`);
        
        const totalUsers = await prisma.user.count();
        const clients = await prisma.user.count({ where: { role: 'CLIENT' } });
        const professionals = await prisma.user.count({ where: { role: 'PROFESSIONAL' } });
        const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
        const superAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
        
        console.log(`  Total Users: ${totalUsers}`);
        console.log(`  - Clients: ${clients}`);
        console.log(`  - Professionals: ${professionals}`);
        console.log(`  - Admins: ${admins}`);
        console.log(`  - Super Admins: ${superAdmins}`);
        
        // 2. Lista utenti esistenti
        console.log(`\n${colors.blue}👥 Utenti esistenti:${colors.reset}`);
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        
        if (users.length > 0) {
            users.forEach(u => {
                console.log(`  ${colors.green}ID:${colors.reset} ${u.id.slice(0, 8)}... | ${colors.yellow}Email:${colors.reset} ${u.email} | ${colors.cyan}Role:${colors.reset} ${u.role}`);
            });
        } else {
            console.log(`  ${colors.red}Nessun utente trovato nel database${colors.reset}`);
        }
        
        // 3. Conta richieste
        console.log(`\n${colors.blue}📋 Richieste di assistenza:${colors.reset}`);
        const totalRequests = await prisma.assistanceRequest.count();
        const pendingRequests = await prisma.assistanceRequest.count({ where: { status: 'PENDING' } });
        const assignedRequests = await prisma.assistanceRequest.count({ where: { status: 'ASSIGNED' } });
        const inProgressRequests = await prisma.assistanceRequest.count({ where: { status: 'IN_PROGRESS' } });
        const completedRequests = await prisma.assistanceRequest.count({ where: { status: 'COMPLETED' } });
        
        console.log(`  Total Requests: ${totalRequests}`);
        console.log(`  - Pending: ${pendingRequests}`);
        console.log(`  - Assigned: ${assignedRequests}`);
        console.log(`  - In Progress: ${inProgressRequests}`);
        console.log(`  - Completed: ${completedRequests}`);
        
        // 4. Conta preventivi
        console.log(`\n${colors.blue}💰 Preventivi:${colors.reset}`);
        const totalQuotes = await prisma.quote.count();
        const draftQuotes = await prisma.quote.count({ where: { status: 'DRAFT' } });
        const pendingQuotes = await prisma.quote.count({ where: { status: 'PENDING' } });
        const acceptedQuotes = await prisma.quote.count({ where: { status: 'ACCEPTED' } });
        
        console.log(`  Total Quotes: ${totalQuotes}`);
        console.log(`  - Draft: ${draftQuotes}`);
        console.log(`  - Pending: ${pendingQuotes}`);
        console.log(`  - Accepted: ${acceptedQuotes}`);
        
        // 5. Categorie
        console.log(`\n${colors.blue}📁 Categorie:${colors.reset}`);
        const categories = await prisma.category.findMany({
            select: { name: true, isActive: true }
        });
        
        if (categories.length > 0) {
            categories.forEach(c => {
                console.log(`  - ${c.name} ${c.isActive ? '✅' : '❌'}`);
            });
        } else {
            console.log(`  ${colors.yellow}Nessuna categoria trovata${colors.reset}`);
        }
        
        console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
        
    } catch (error) {
        console.error(`${colors.red}Errore durante la verifica del database:${colors.reset}`, error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Esegui la verifica
checkDatabase().catch(error => {
    console.error(`${colors.red}Errore critico:${colors.reset}`, error);
    process.exit(1);
});
