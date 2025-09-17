// Test script per verificare gli endpoint delle sottocategorie
const axios = require('axios');

async function testSubcategoriesEndpoints() {
  const baseURL = 'http://localhost:3200/api';
  
  // Prima facciamo login per ottenere il token
  try {
    console.log('🔐 Login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token:', token ? 'obtained' : 'missing');
    
    // Configurazione headers con token
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    // Test 1: GET /api/subcategories
    console.log('\n📋 Test 1: GET /api/subcategories');
    try {
      const response = await axios.get(`${baseURL}/subcategories`, config);
      console.log('✅ Success:', response.data.subcategories?.length || 0, 'subcategories found');
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.error || error.message);
    }
    
    // Test 2: GET /api/subcategories con categoryId
    console.log('\n📋 Test 2: GET /api/subcategories?categoryId=xxx');
    try {
      // Prima otteniamo una categoria
      const categoriesResponse = await axios.get(`${baseURL}/categories`, config);
      if (categoriesResponse.data.categories && categoriesResponse.data.categories.length > 0) {
        const categoryId = categoriesResponse.data.categories[0].id;
        console.log('Using categoryId:', categoryId);
        
        const response = await axios.get(`${baseURL}/subcategories?categoryId=${categoryId}`, config);
        console.log('✅ Success:', response.data.subcategories?.length || 0, 'subcategories found for category');
      } else {
        console.log('⚠️ No categories found to test with');
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.error || error.message);
    }
    
    // Test 3: GET /api/subcategories/by-category/:id
    console.log('\n📋 Test 3: GET /api/subcategories/by-category/:id');
    try {
      const categoriesResponse = await axios.get(`${baseURL}/categories`, config);
      if (categoriesResponse.data.categories && categoriesResponse.data.categories.length > 0) {
        const categoryId = categoriesResponse.data.categories[0].id;
        console.log('Using categoryId:', categoryId);
        
        const response = await axios.get(`${baseURL}/subcategories/by-category/${categoryId}`, config);
        console.log('✅ Success:', response.data.subcategories?.length || 0, 'subcategories found');
      } else {
        console.log('⚠️ No categories found to test with');
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.status, error.response?.data?.error || error.message);
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.error || error.message);
  }
}

// Esegui il test
console.log('🚀 Testing Subcategories Endpoints...\n');
testSubcategoriesEndpoints()
  .then(() => console.log('\n✅ Tests completed'))
  .catch(err => console.error('\n❌ Test failed:', err));
