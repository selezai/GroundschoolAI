import express from 'express';
import cors from 'cors';
import path from 'path';
import topicRoutes from './routes/topicRoutes';
import aiRoutes from './routes/aiRoutes';
import healthRoutes from './routes/healthRoutes';
import fs from 'fs';

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

// Serve static files from the Expo web build
const webBuildPath = path.join('/opt/render/project/src/dist/web-build');
console.log('Web build path:', webBuildPath);

// List directory contents for debugging
try {
  console.log('Root directory contents:', fs.readdirSync('/opt/render/project/src'));
  console.log('Dist directory contents:', fs.readdirSync('/opt/render/project/src/dist'));
  if (fs.existsSync(webBuildPath)) {
    console.log('Web build directory contents:', fs.readdirSync(webBuildPath));
  }
} catch (error) {
  console.error('Error listing directory contents:', error);
}

if (!fs.existsSync(webBuildPath)) {
  console.error('Web build directory not found at:', webBuildPath);
} else {
  console.log('Web build directory found at:', webBuildPath);
  app.use(express.static(webBuildPath));
}

// Handle client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(webBuildPath, 'index.html');
  console.log('Attempting to serve index.html from:', indexPath);
  
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    return res.status(404).send('Application files not found');
  }
  
  res.sendFile(indexPath);
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
