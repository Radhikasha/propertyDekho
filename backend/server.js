const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Set JWT secret if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your_jwt_secret';
  console.warn('WARNING: JWT_SECRET is not set. Using default secret for development.');
}

const app = express();

// Logging middleware
app.use(morgan('dev'));

// Body parser middleware with increased limits
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('Invalid JSON received');
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true,
  parameterLimit: 50000
}));

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// MongoDB connection with your Atlas URL
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in .env file');
    process.exit(1);
  }
  
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('Using connection string:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@'));
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 seconds
    });
    console.log(`✅ MongoDB Connected to: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Go to MongoDB Atlas > Network Access');
    console.log('2. Click "Add IP Address"');
    console.log('3. Click "Allow Access from Anywhere" (0.0.0.0/0)');
    console.log('4. Wait 1-2 minutes after whitelisting');
    console.log('5. Verify your username/password in the connection string');
    console.log('\n🔗 Current connection string being used:');
    console.log(MONGODB_URI.replace(/:([^:]*?)@/, ':***@')); // Hide password in logs
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Add cookie parser
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Routes
app.use('/api', require('./routes/test'));  // Test route
app.use('/api/auth', require('./routes/testAuth'));  // Using test auth routes
app.use('/api/properties', require('./routes/properties'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/enquiries', require('./routes/enquiry'));  // Add this line for enquiry routes

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET http://localhost:${PORT}/api/properties`);
  console.log(`- GET http://localhost:${PORT}/api/clients`);
  console.log(`- GET http://localhost:${PORT}/api/meetings`);
});
