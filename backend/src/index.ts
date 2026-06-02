import express, { Application } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { KeyManagementService } from './services/kms.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Import middleware
import {
    helmetConfig,
    corsConfig,
    rateLimiter,
    sanitizeInput,
    errorHandler
} from './middleware/security.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import consentRoutes from './routes/consent.routes';
import auditRoutes from './routes/audit.routes';
import medicineRoutes from './routes/medicine.routes';
import prescriptionRoutes from './routes/prescription.routes';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 3000;

/**
 * Validate environment configuration on startup
 */
function validateEnvironment(): void {
    try {
        KeyManagementService.validateConfig();
        logger.info('✓ Environment configuration validated');
    } catch (error: any) {
        logger.error('✗ Environment validation failed:', { error: error.message });
        process.exit(1);
    }
}

/**
 * Initialize middleware
 */
function initializeMiddleware(): void {
    // Security headers
    app.use(helmetConfig);

    // CORS
    app.use(corsConfig);

    // Rate limiting
    app.use(rateLimiter);

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Input sanitization
    app.use(sanitizeInput);

    console.log('✓ Middleware initialized');
}

/**
 * Initialize routes
 */
function initializeRoutes(): void {
    // Health check
    app.get('/health', (_req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/patients', patientRoutes);
    app.use('/api/consent', consentRoutes);
    app.use('/api/audit', auditRoutes);
    app.use('/api/medicines', medicineRoutes);
    app.use('/api/prescriptions', prescriptionRoutes);

    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({ error: 'Route not found' });
    });

    // Error handler (must be last)
    app.use(errorHandler);

    console.log('✓ Routes initialized');
}

/**
 * Connect to database
 */
async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        logger.info('✓ Database connected');
    } catch (error) {
        logger.error('✗ Database connection failed:', { error });
        process.exit(1);
    }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(): Promise<void> {
    console.log('\nShutting down gracefully...');

    try {
        await prisma.$disconnect();
        console.log('✓ Database disconnected');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error during shutdown:', error);
        process.exit(1);
    }
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
    try {
        // Validate environment
        validateEnvironment();

        // Connect to database
        await connectDatabase();

        // Initialize middleware
        initializeMiddleware();

        // Initialize routes
        initializeRoutes();

        // Start listening
        app.listen(PORT, () => {
            logger.info('PharmaLync Backend Server Started', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                blockchain: process.env.BLOCKCHAIN_NETWORK || 'Not configured'
            });
            logger.info(`📚 API Documentation: http://localhost:${PORT}/health`);
        });

        // Handle shutdown signals
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        logger.error('✗ Failed to start server:', { error });
        process.exit(1);
    }
}

// Start the server
startServer();

export default app;
