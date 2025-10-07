/**
 * Test rapido per verificare che useFormDraft funzioni
 * Questo file può essere cancellato dopo il test
 */

// Test della funzione debounce
function testDebounce() {
  console.log('🧪 Testing debounce function...');
  
  let counter = 0;
  
  // Implementazione semplice di debounce per test
  function debounce(func, wait) {
    let timeoutId = null;
    
    const debounced = (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        timeoutId = null;
      }, wait);
    };
    
    debounced.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    debounced.flush = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        func();
        timeoutId = null;
      }
    };
    
    return debounced;
  }
  
  const debouncedFunction = debounce(() => {
    counter++;
    console.log(`✅ Debounce function called! Counter: ${counter}`);
  }, 100);
  
  // Test multiple calls
  debouncedFunction();
  debouncedFunction();
  debouncedFunction();
  
  // Should only call once after 100ms
  setTimeout(() => {
    if (counter === 1) {
      console.log('✅ Debounce test PASSED!');
    } else {
      console.log(`❌ Debounce test FAILED! Expected 1, got ${counter}`);
    }
  }, 200);
}

// Test localStorage
function testLocalStorage() {
  console.log('🧪 Testing localStorage...');
  
  try {
    const testKey = 'draft_test';
    const testData = {
      data: { test: 'value' },
      timestamp: new Date().toISOString(),
      formId: 'test'
    };
    
    // Save
    localStorage.setItem(testKey, JSON.stringify(testData));
    console.log('✅ localStorage write successful');
    
    // Load
    const loaded = JSON.parse(localStorage.getItem(testKey));
    if (loaded && loaded.data.test === 'value') {
      console.log('✅ localStorage read successful');
    } else {
      console.log('❌ localStorage read failed');
    }
    
    // Cleanup
    localStorage.removeItem(testKey);
    console.log('✅ localStorage cleanup successful');
    
  } catch (error) {
    console.log('❌ localStorage test failed:', error);
  }
}

// Run tests
console.log('🚀 Starting useFormDraft tests...');
testDebounce();
testLocalStorage();

export default { testDebounce, testLocalStorage };
