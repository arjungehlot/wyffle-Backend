
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import applicationsRouter from './routes/applications.routes';
import studentsRouter from './routes/students.routes';
import paymentsRouter from './routes/payments.routes';
import documentsRouter from './routes/documents.routes';
import adminRouter from './routes/admin.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration ---
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://wyffle.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8081'
];

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/applications', applicationsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/admin', adminRouter);

// Start the server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
}

export default app;
