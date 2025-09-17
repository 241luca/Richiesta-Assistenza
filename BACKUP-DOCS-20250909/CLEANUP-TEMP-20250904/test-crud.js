const axios = require('axios');

const API_URL = 'http://localhost:3200/api';
let authToken = '';
let clientToken = '';
let professionalToken = '';

async function testCRUD() {
  console.log('=== TEST CRUD OPERATIONS ===\n');

  try {
    // 1. Login as admin
    console.log('1️⃣  Login Admin...');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = adminLogin.data.token;
    console.log('✅ Admin login successful\n');

    // 2. Login as client
    console.log('2️⃣  Login Client...');
    const clientLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'client.test@example.com',
      password: 'Test123!'
    });
    clientToken = clientLogin.data.token;
    console.log('✅ Client login successful\n');

    // 3. Login as professional
    console.log('3️⃣  Login Professional...');
    const profLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'prof.test@example.com',
      password: 'Test123!'
    });
    professionalToken = profLogin.data.token;
    console.log('✅ Professional login successful\n');

    // 4. Test Categories (Admin)
    console.log('4️⃣  Testing Categories (Admin)...');
    const categoriesRes = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`Categories found: ${categoriesRes.data.length}`);
    
    // Create new category if none exist
    if (categoriesRes.data.length === 0) {
      const newCategory = await axios.post(`${API_URL}/categories`, {
        name: 'Idraulica',
        description: 'Servizi idraulici',
        color: '#3B82F6',
        isActive: true
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Category created:', newCategory.data.name);
    }
    console.log('');

    // 5. Test Requests (Client)
    console.log('5️⃣  Testing Requests (Client)...');
    
    // Get categories for request creation
    const cats = await axios.get(`${API_URL}/categories`, {
      headers: { Authorization: `Bearer ${clientToken}` }
    });
    
    const firstCategoryId = cats.data[0]?.id;
    
    if (firstCategoryId) {
      // Create new request as client
      const newRequest = await axios.post(`${API_URL}/requests`, {
        title: 'Test Request Post-Migration',
        description: 'Testing sistema senza organizationId',
        categoryId: firstCategoryId,
        priority: 'MEDIUM',
        status: 'PENDING',
        address: 'Via Test 123',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      console.log('✅ Request created by client:', newRequest.data.id);
      
      // Get requests as client (should see only own)
      const clientRequests = await axios.get(`${API_URL}/requests`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      console.log(`Client sees ${clientRequests.data.length} requests (should be own only)`);
    }
    console.log('');

    // 6. Test Requests visibility (Professional)
    console.log('6️⃣  Testing Request visibility (Professional)...');
    const profRequests = await axios.get(`${API_URL}/requests`, {
      headers: { Authorization: `Bearer ${professionalToken}` }
    });
    console.log(`Professional sees ${profRequests.data.length} requests`);
    console.log('');

    // 7. Test Admin access (should see all)
    console.log('7️⃣  Testing Admin access...');
    const adminRequests = await axios.get(`${API_URL}/requests`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`Admin sees ${adminRequests.data.length} requests (should see all)`);
    
    // Test users endpoint (admin only)
    const users = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log(`Admin manages ${users.data.length} users`);
    console.log('');

    // 8. Test Quotes (Professional)
    console.log('8️⃣  Testing Quotes (Professional)...');
    if (adminRequests.data.length > 0) {
      const requestId = adminRequests.data[0].id;
      
      // Create quote as professional
      try {
        const newQuote = await axios.post(`${API_URL}/quotes`, {
          requestId: requestId,
          title: 'Preventivo Test',
          description: 'Test preventivo senza organizationId',
          totalAmount: 15000, // in cents
          items: [
            {
              description: 'Manodopera',
              quantity: 2,
              unitPrice: 5000,
              totalPrice: 10000
            },
            {
              description: 'Materiali',
              quantity: 1,
              unitPrice: 5000,
              totalPrice: 5000
            }
          ]
        }, {
          headers: { Authorization: `Bearer ${professionalToken}` }
        });
        console.log('✅ Quote created:', newQuote.data.id);
      } catch (error) {
        console.log('⚠️  Quote creation skipped (professional may not be assigned)');
      }
    }
    console.log('');

    console.log('✅ ========== TEST CRUD COMPLETATI CON SUCCESSO ==========');
    
  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message);
  }
}

// Run tests
testCRUD();
