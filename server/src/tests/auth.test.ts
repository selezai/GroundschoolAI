import axios from 'axios';

const API_URL = 'http://localhost:8080/api';
const testUser = {
  email: 'test@example.com',
  password: 'test123',
  name: 'Test User'
};

let authToken: string;

async function testAuthFlow() {
  try {
    console.log('1. Testing Registration...');
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('Registration successful:', registerResponse.data);

    console.log('\n2. Testing Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = loginResponse.data.token;
    console.log('Login successful:', loginResponse.data);

    console.log('\n3. Testing Protected Route...');
    const protectedResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('Protected route access successful:', protectedResponse.data);

  } catch (error: any) {
    console.error('Error during authentication flow:', error.response?.data || error.message);
  }
}

testAuthFlow();
