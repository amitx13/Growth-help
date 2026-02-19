import express, { Express, Request, Response } from 'express';
import path from "path";
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  'https://growthhelp.in',
  'https://www.growthhelp.in',
  'https://admin.growthhelp.in',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(cookieParser());

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'API is running!' });
});

// API routes
app.use('/api/v1', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(`⚡️[server]: Network access: http://0.0.0.0:${port}`);
});

export default app;
