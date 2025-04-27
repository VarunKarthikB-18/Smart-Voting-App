import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './db';
import { initializeAdmin } from './admin-init';
import cors from 'cors';
import { AddressInfo } from 'net';

const app = express();

// CORS configuration - allow all local development origins
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost and local network origins
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):\d+$/)) {
      return callback(null, true);
    }
    
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

app.use(express.json({ limit: '5mb' })); // Increased limit for face data
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database before setting up routes
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Initialize the admin user
    await initializeAdmin();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Always set up Vite for local development in Replit
  await setupVite(app, server);

  // Try ports starting from 3000 until we find an available one
  const tryPort = async (port: number): Promise<number> => {
    try {
      await new Promise((resolve, reject) => {
        server.listen(port, '0.0.0.0')
          .once('listening', () => {
            const address = server.address() as AddressInfo;
            console.log(`Server running at http://localhost:${address.port}`);
            resolve(address.port);
          })
          .once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
              server.close();
              resolve(tryPort(port + 1));
            } else {
              reject(err);
            }
          });
      });
      return port;
    } catch (err) {
      if (port < 3010) { // Try up to port 3010
        return tryPort(port + 1);
      }
      throw err;
    }
  };

  const startPort = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  await tryPort(startPort);
})();
