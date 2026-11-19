import { Router, Request, Response } from "express";
import { tuitionsCollection } from "../config/db";

const router = Router();

// GET /api/tuitions?limit=6
router.get("/", async (req: Request, res: Response) => {
  try {
    const tuitions = await tuitionsCollection();

    let limit = Number(req.query.limit);
    if (isNaN(limit) || limit < 1) {
      limit = 12;
    }
    if (limit > 50) {
      limit = 50;
    }

    const filter = { approvalStatus: "approved", isActive: true };

    const result = await tuitions
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({ tuitions: result });
  } catch (error) {
    res.status(500).json({ message: "Failed to load tuitions" });
  }
});

export default router;