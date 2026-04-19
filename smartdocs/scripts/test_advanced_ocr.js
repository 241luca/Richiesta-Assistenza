#!/usr/bin/env node
/**
 * test_advanced_ocr.js
 * 
 * Script di test per Advanced OCR Service
 * Testa sia Docling che PaddleOCR-VL
 * 
 * Usage:
 *   node scripts/test_advanced_ocr.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3500';
const TEST_FILE = process.env.TEST_FILE || path.join(__dirname, '../test-data/sample.pdf');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthCheck() {
  log('\n🔍 Testing OCR Health Check...', 'blue');
  
  try {
    const response = await axios.get(`${API_BASE}/api/ocr/health`);
    
    if (response.data.success) {
      log(`✅ Status: ${response.data.status}`, 'green');
      log(`   Message: ${response.data.message}`, 'green');
      log(`   Engines:`, 'green');
      log(`     - Docling: ${response.data.engines.docling ? '✅' : '❌'}`, 'green');
      log(`     - PaddleOCR: ${response.data.engines.paddleocr ? '✅' : '❌'}`, 'green');
      return true;
    } else {
      log('❌ Health check failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testEngineAvailability() {
  log('\n🔧 Testing Engine Availability...', 'blue');
  
  try {
    const response = await axios.get(`${API_BASE}/api/ocr/engines`);
    
    if (response.data.success) {
      const { engines, recommendation } = response.data.data;
      
      log('✅ Engines:', 'green');
      
      if (engines.docling.available) {
        log(`   📄 Docling: Available`, 'green');
        log(`      - ${engines.docling.description}`, 'green');
        log(`      - Strengths: ${engines.docling.strengths.join(', ')}`, 'green');
      } else {
        log(`   📄 Docling: Not available`, 'yellow');
      }
      
      if (engines.paddleocr.available) {
        log(`   🤖 PaddleOCR-VL: Available`, 'green');
        log(`      - ${engines.paddleocr.description}`, 'green');
        log(`      - Strengths: ${engines.paddleocr.strengths.join(', ')}`, 'green');
      } else {
        log(`   🤖 PaddleOCR-VL: Not available`, 'yellow');
      }
      
      log(`\n   💡 Recommendation: ${recommendation}`, 'blue');
      
      return engines.docling.available || engines.paddleocr.available;
    } else {
      log('❌ Engine check failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function testDocumentProcessing(engine = 'auto') {
  log(`\n📄 Testing Document Processing (engine: ${engine})...`, 'blue');
  
  // Check if test file exists
  if (!fs.existsSync(TEST_FILE)) {
    log(`⚠️  Test file not found: ${TEST_FILE}`, 'yellow');
    log(`   Please provide a PDF file with TEST_FILE environment variable`, 'yellow');
    return false;
  }
  
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(TEST_FILE));
    form.append('engine', engine);
    form.append('enableOCR', 'true');
    form.append('enableTableExtraction', 'true');
    form.append('ocrLanguages', 'it,en');
    form.append('outputFormat', 'markdown');
    
    log(`   Processing: ${path.basename(TEST_FILE)}`, 'blue');
    
    const startTime = Date.now();
    const response = await axios.post(
      `${API_BASE}/api/ocr/process`,
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    const processingTime = Date.now() - startTime;
    
    if (response.data.success) {
      const { data } = response.data;
      
      log(`✅ Processing completed in ${processingTime}ms`, 'green');
      log(`   Engine used: ${data.engine}`, 'green');
      log(`   Pages: ${data.metadata.pageCount || 'N/A'}`, 'green');
      log(`   Words: ${data.metadata.wordCount}`, 'green');
      log(`   Characters: ${data.metadata.characterCount}`, 'green');
      log(`   Tables found: ${data.tables?.length || 0}`, 'green');
      log(`   Formulas found: ${data.formulas?.length || 0}`, 'green');
      
      if (data.text) {
        log(`\n   📝 Text preview (first 200 chars):`, 'blue');
        log(`   ${data.text.substring(0, 200)}...`, 'reset');
      }
      
      if (data.tables && data.tables.length > 0) {
        log(`\n   📊 First table info:`, 'blue');
        const table = data.tables[0];
        log(`      Rows: ${table.rows}, Columns: ${table.columns}`, 'reset');
      }
      
      if (data.warnings && data.warnings.length > 0) {
        log(`\n   ⚠️  Warnings:`, 'yellow');
        data.warnings.forEach(w => log(`      - ${w}`, 'yellow'));
      }
      
      return true;
    } else {
      log(`❌ Processing failed: ${response.data.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   Details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

async function main() {
  log('╔═══════════════════════════════════════╗', 'blue');
  log('║  SmartDocs Advanced OCR Test Suite   ║', 'blue');
  log('╚═══════════════════════════════════════╝', 'blue');
  
  const results = {
    healthCheck: false,
    engineAvailability: false,
    autoProcessing: false,
    doclingProcessing: false,
    paddleocrProcessing: false
  };
  
  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  
  // Test 2: Engine Availability
  results.engineAvailability = await testEngineAvailability();
  
  // Test 3: Auto Processing
  if (results.engineAvailability) {
    results.autoProcessing = await testDocumentProcessing('auto');
    
    // Test 4: Docling Processing
    results.doclingProcessing = await testDocumentProcessing('docling');
    
    // Test 5: PaddleOCR Processing
    results.paddleocrProcessing = await testDocumentProcessing('paddleocr');
  } else {
    log('\n⚠️  Skipping processing tests - no engines available', 'yellow');
  }
  
  // Summary
  log('\n╔═══════════════════════════════════════╗', 'blue');
  log('║         Test Results Summary          ║', 'blue');
  log('╚═══════════════════════════════════════╝', 'blue');
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${icon} ${test.padEnd(30)} ${passed ? 'PASSED' : 'FAILED'}`, color);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  log(`\n📊 Total: ${passedCount}/${totalCount} tests passed`, 'blue');
  
  if (passedCount === totalCount) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else if (passedCount > 0) {
    log('\n⚠️  Some tests failed', 'yellow');
    process.exit(1);
  } else {
    log('\n❌ All tests failed', 'red');
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
