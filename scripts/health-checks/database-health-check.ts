score}/100)`);
  console.log(`Execution Time: ${result.executionTime}ms`);
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (result.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    result.recommendations.forEach(r => console.log(`  - ${r}`));
  }
  
  console.log('\n📊 METRICS:');
  Object.entries(result.metrics).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  // Exit con codice appropriato
  process.exit(result.status === 'healthy' ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default DatabaseHealthCheck;
