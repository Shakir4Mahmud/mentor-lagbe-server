import { Router, Response } from "express";
import {
  verifyToken,
  verifyStudent,
  verifyTutor,
  verifyAdmin,
} from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

router.get("/me", verifyToken, (req: AuthRequest, res: Response) => {
  res.json({ message: "Token is valid", user: req.user });
});

router.get(
  "/student",
  verifyToken,
  verifyStudent,
  (req: AuthRequest, res: Response) => {
    res.json({ message: "Hello Student", user: req.user });
  }
);

router.get(
  "/tutor",
  verifyToken,
  verifyTutor,
  (req: AuthRequest, res: Response) => {
    res.json({ message: "Hello Tutor", user: req.user });
  }
);

router.get(
  "/admin",
  verifyToken,
  verifyAdmin,
  (req: AuthRequest, res: Response) => {
    res.json({ message: "Hello Admin", user: req.user });
  }
);

export default router;