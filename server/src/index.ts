import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import topicRoutes from './routes/topicRoutes';
import aiRoutes from './routes/aiRoutes';
import healthRoutes from './routes/healthRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (before any other routes)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓' : '✗',
      PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ? '✓' : '✗',
      PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? '✓' : '✗',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✓' : '✗'
    }
  });
});

// API Routes
app.use('/api/topics', topicRoutes);
app.use('/api/ai', aiRoutes);

// Serve static files from the React app
const clientBuildPath = path.join(__dirname, '../../web-build');
app.use(express.static(clientBuildPath));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓' : '✗',
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ? '✓' : '✗',
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? '✓' : '✗',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✓' : '✗'
  });
});
