import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { usersCollection } from "../config/db";
import { AuthRequest } from "../types";

// 1. Token verify kore user ke req.user e rakhe
export async function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: token missing" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: "JWT_SECRET is missing in .env" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as { email: string };

    // role database theke ni, token theke na
    const users = await usersCollection();
    const user = await users.findOne({ email: decoded.email });

    if (!user) {
      res.status(401).json({ message: "Unauthorized: user not found" });
      return;
    }

    let role = "student";
    if (user.role) {
      role = user.role;
    }

    let plan = "free";
    if (user.plan) {
      plan = user.plan;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: role,
      plan: plan,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: invalid or expired token" });
  }
}

// 2. Sudhu student
export function verifyStudent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "student") {
    res.status(403).json({ message: "Forbidden: students only" });
    return;
  }
  next();
}

// 3. Sudhu tutor
export function verifyTutor(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "tutor") {
    res.status(403).json({ message: "Forbidden: tutors only" });
    return;
  }
  next();
}

// 4. Sudhu admin
export function verifyAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Forbidden: admins only" });
    return;
  }
  next();
}