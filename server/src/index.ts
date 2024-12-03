import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import topicRoutes from './routes/topicRoutes';
import aiRoutes from './routes/aiRoutes';
import healthRoutes from './routes/healthRoutes';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Print environment variables (excluding sensitive values)
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✓' : '✗',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY ? '✓' : '✗',
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY ? '✓' : '✗',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✓' : '✗'
});

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

// List all possible web build paths for debugging
const possiblePaths = [
  path.join(__dirname, '../../../dist/web-build'),
  path.join(__dirname, '../../web-build'),
  path.join(__dirname, '../../../web-build'),
  path.join(process.cwd(), 'dist/web-build'),
  path.join(process.cwd(), 'web-build')
];

console.log('Checking possible web build paths:');
possiblePaths.forEach(p => {
  console.log(`${p}: ${fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`);
  if (fs.existsSync(p)) {
    console.log('Contents:', fs.readdirSync(p));
  }
});

// Find the first existing web build path
const webBuildPath = possiblePaths.find(p => fs.existsSync(p));

if (!webBuildPath) {
  console.error('No web build directory found in any of the possible locations');
} else {
  console.log('Using web build path:', webBuildPath);
  app.use(express.static(webBuildPath));
}

// Handle client-side routing
app.get('*', (req, res) => {
  if (!webBuildPath) {
    return res.status(404).send('Web build directory not found');
  }

  try {
    const indexPath = path.join(webBuildPath, 'index.html');
    console.log('Attempting to serve index.html from:', indexPath);
    
    if (!fs.existsSync(indexPath)) {
      console.error('index.html not found at:', indexPath);
      return res.status(404).send('Application files not found');
    }
    
    res.sendFile(indexPath);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Error serving the application');
  }
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
});
