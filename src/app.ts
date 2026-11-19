import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import testRoutes from "./routes/test.routes";
import tuitionRoutes from "./routes/tuition.routes";

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());

// Home route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "MentorLagbe server is running" });
});

// Health check
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    await db.command({ ping: 1 });
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "not connected" });
  }
});

// Temporary test routes
app.use("/api/test", testRoutes);

// Tuition routes
app.use("/api/tuitions", tuitionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ message: err.message || "Something went wrong" });
});

export default app;