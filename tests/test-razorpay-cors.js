import axios from 'axios';

// Test CORS headers for Razorpay endpoints
async function testRazorpayCORS() {
    try {
        console.log('Testing Razorpay CORS headers...\n');
        
        // Test OPTIONS request (preflight)
        const optionsResponse = await axios.options('http://localhost:3000/api/razorpay/create-order', {
            headers: {
                'Origin': 'http://localhost:8082',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log('OPTIONS Response Headers:');
        console.log('Access-Control-Allow-Origin:', optionsResponse.headers['access-control-allow-origin']);
        console.log('Access-Control-Allow-Methods:', optionsResponse.headers['access-control-allow-methods']);
        console.log('Access-Control-Allow-Headers:', optionsResponse.headers['access-control-allow-headers']);
        console.log('Access-Control-Allow-Credentials:', optionsResponse.headers['access-control-allow-credentials']);
        
        // Test actual POST request
        const postResponse = await axios.post('http://localhost:3000/api/razorpay/create-order', {
            amount: 200,
            orderType: 'consultation',
            consultationType: 'virtual'
        }, {
            headers: {
                'Origin': 'http://localhost:8082',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\nPOST Response Headers:');
        console.log('Access-Control-Allow-Origin:', postResponse.headers['access-control-allow-origin']);
        console.log('Response Status:', postResponse.status);
        console.log('Response Data:', JSON.stringify(postResponse.data, null, 2));
        
        console.log('\n✅ Razorpay CORS test passed! No CORS errors detected.');
        
    } catch (error) {
        if (error.response) {
            console.log('\n❌ CORS Error Details:');
            console.log('Status:', error.response.status);
            console.log('Headers:', error.response.headers);
            console.log('Data:', error.response.data);
        } else {
            console.log('\n❌ Request Error:', error.message);
        }
    }
}

testRazorpayCORS();
