import express from 'express';
import cors from 'cors';
import path from 'path';
import topicRoutes from './routes/topicRoutes';
import aiRoutes from './routes/aiRoutes';
import healthRoutes from './routes/healthRoutes';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 8080;

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

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://groundschool-ai.onrender.com', 'https://groundschoolai.com']
    : ['http://localhost:19006', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// API routes
app.use('/api/topics', topicRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/health', healthRoutes);

// Debug directory structure
const serverDir = process.cwd();
const webBuildPath = path.join(serverDir, 'dist', 'web-build');

console.log('Directory structure:');
console.log('Server directory:', serverDir);
console.log('Web build path:', webBuildPath);

// List all directories
try {
  console.log('\nServer directory contents:', fs.readdirSync(serverDir));
  
  const distPath = path.join(serverDir, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('\nDist directory contents:', fs.readdirSync(distPath));
    
    if (fs.existsSync(webBuildPath)) {
      console.log('\nWeb build directory contents:', fs.readdirSync(webBuildPath));
    } else {
      console.error('\nWeb build directory not found at:', webBuildPath);
    }
  } else {
    console.error('\nDist directory not found at:', distPath);
  }
} catch (error) {
  console.error('Error listing directories:', error);
}

// Serve static files if they exist
if (fs.existsSync(webBuildPath)) {
  console.log('\nServing static files from:', webBuildPath);
  app.use(express.static(webBuildPath));
  
  // Handle client-side routing
  app.get('*', (req, res) => {
    const indexPath = path.join(webBuildPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application files not found');
    }
  });
} else {
  app.get('*', (req, res) => {
    res.status(404).send('Web build directory not found. Please ensure the application is built correctly.');
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
