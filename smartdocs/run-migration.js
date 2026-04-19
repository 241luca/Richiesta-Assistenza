#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Leggi il .env
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://smartdocs:smartdocs_secure_pwd@localhost:5433/smartdocs';

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: false
});

async function runMigration() {
  try {
    console.log('🔄 Connessione al database...');
    await client.connect();
    console.log('✅ Connesso!\n');

    // Leggi il file SQL
    const sqlFile = path.join(__dirname, 'scripts/06-worker-v2-retry-tracking.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');

    console.log('📋 Esecuzione migration...\n');
    
    // Esegui la query
    await client.query(sql);
    
    console.log('\n✅ Migration completata con successo!\n');

    // Verifica che le tabelle siano state create
    console.log('🔍 Verifica tabelle...\n');
    
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'smartdocs' 
      AND table_name = 'sync_jobs' 
      AND column_name IN ('retry_count', 'failed_phase', 'error_message')
      ORDER BY ordinal_position;
    `);

    console.log('📊 Colonne aggiunte:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });

    // Controlla che la tabella di audit sia stata creata
    const auditResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'smartdocs' 
        AND table_name = 'sync_jobs_audit'
      );
    `);

    if (auditResult.rows[0].exists) {
      console.log('  ✓ sync_jobs_audit table created');
    }

    // Controlla gli indici
    const indexResult = await client.query(`
      SELECT indexname FROM pg_indexes 
      WHERE schemaname = 'smartdocs' 
      AND tablename = 'sync_jobs' 
      AND indexname LIKE 'idx_%';
    `);

    console.log(`\n📑 Indici creati: ${indexResult.rows.length}`);
    
    console.log('\n🎉 Tutto completato con successo!');
    
  } catch (err) {
    console.error('❌ Errore durante la migration:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
