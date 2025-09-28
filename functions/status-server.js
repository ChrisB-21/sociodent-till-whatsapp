import express from 'express';
import cors from 'cors';

const app = express();

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Simple status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    timestamp: new Date().toISOString()
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Simple status server running on port ${PORT}`);
});
