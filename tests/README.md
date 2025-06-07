# Testing Tools for SocioDent

This directory contains various testing and diagnostic tools for the SocioDent application. All test files have been consolidated here for better organization.

## Test Categories

### 🔥 Firebase Tests
- **test-firebase-connection.js** - Tests Firebase database connection and data retrieval
- **test-firebase.js** - Basic Firebase initialization test
- **test-cors.js** - Firebase Storage CORS configuration test
- **test-new-firebase-credentials.js** - Tests new Firebase credentials
- **firebase-storage-test.html** - Interactive Firebase Storage test

### 🩺 Doctor Assignment Tests
- **test-enhanced-doctor-assignment.js** - Tests the enhanced doctor assignment algorithm
- **test-proximity-logic.js** - Tests location-based doctor assignment
- **test-assignment.js** - Basic doctor assignment functionality
- **debug-assignment.js** - Debug tools for assignment issues

### 📅 Appointment Tests
- **test-appointment-confirmation.js** - Tests appointment confirmation flow
- **test-appointment-visibility-fix.js** - Tests appointment visibility fixes
- **test-appointment-fix.html** - Interactive appointment testing
- **appointment-confirmation-test.js** - Appointment confirmation testing
- **debug-appointments.html** - Debug appointments display

### 💳 Payment Tests
- **test-payment-flow.js** - Tests Razorpay payment integration
- **test-razorpay-cors.js** - Tests Razorpay CORS configuration
- **razorpay-test.html** - Interactive Razorpay testing
- **razorpay-test-server.js** - Razorpay test server

### 🔐 Authentication Tests
- **test-auth-fix.html** - Interactive authentication testing
- **test-auth-flow.html** - Authentication flow testing

### 📄 Report Tests
- **test-report-appointment.js** - Tests appointment with report functionality
- **test-report-upload.html** - Interactive report upload testing
- **test-upload.js** - File upload testing
- **test-report.pdf** - Sample PDF for testing

### 🛠️ Utility Tests
- **test-complete-flow.js** - End-to-end flow testing
- **test-database-permissions.js** - Database permissions testing
- **check-db-data.js** - Database data verification
- **create-test-appointment.js** - Creates test appointments
- **setup-sample-data.js** - Sets up sample data for testing

### 🌐 Server Tests
- **cors-test-server.js** - CORS testing server
- **status-server.js** - Server status testing
- **cors-test.html** - Interactive CORS testing

### 🐛 Debug Tools
- **debug-sreeram-appointments.html** - Debug specific user appointments
- **debug-user-appointments.js** - Debug user appointment issues
- **debug-assignment.html** - Debug assignment issues

## Running Tests

Most JavaScript tests can be run with Node.js:
```bash
node tests/test-firebase-connection.js
```

HTML tests should be opened in a browser for interactive testing.

## Test Documentation
- **appointment-testing.md** - Detailed appointment testing documentation

### Razorpay Integration Test
- **File**: `razorpay-test-server.js`
- **Purpose**: Serves a test page for testing Razorpay payment integration
- **Run**: `npm run test:razorpay`
- **Access**: Open `http://localhost:8081` in your browser

### Appointment Confirmation Test
- **File**: `appointment-confirmation-test.js`
- **Purpose**: Tests the ability to update appointment status and assign doctors
- **Run**: `npm run test:appointment`

## Test Server Files

- `cors-test-server.js`: A simple server to test CORS configuration
- `status-server.js`: A minimal server that exposes a status endpoint

## Troubleshooting

### CORS Issues
If you're experiencing CORS issues with Firebase Storage:
1. Run `npm run test:cors` to verify the CORS configuration
2. Check `cors.json` for the correct CORS settings
3. Make sure the correct bucket name is configured in both backend and frontend

### Database Permission Issues
If you're experiencing permission issues with Firebase Database:
1. Run `npm run test:db` to verify the database permissions
2. Check `database.rules.json` for the correct security rules
3. Make sure the rules have been deployed with `firebase deploy --only database`

### Razorpay Integration Issues
If you're experiencing issues with Razorpay:
1. Run `npm run test:razorpay` and open `http://localhost:8081` in your browser
2. Test the payment flow and check the console for any errors
3. Verify that the correct Razorpay API keys are set in the `.env` file

### Admin Portal Appointment Confirmation Issues
If you're experiencing issues with confirming appointments or assigning doctors in the admin portal:
1. Run `npm run test:appointment` to test appointment status updates and doctor assignments
2. Check the console for specific error messages
3. Verify that the security rules in `database.rules.json` allow admins to update appointments
4. Ensure the user has admin privileges and is properly authenticated
