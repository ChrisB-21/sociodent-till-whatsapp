import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.resolve(__dirname, '..');

const app = express();
const PORT = 8081;

// Serve static files from the parent directory
app.use(express.static(parentDir));

// Serve the Razorpay test page
app.get('/', (req, res) => {
  res.sendFile(path.join(parentDir, 'razorpay-test.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Razorpay test server running at http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to test Razorpay integration`);
});
