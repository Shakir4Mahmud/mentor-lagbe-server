import { Router, Request, Response } from "express";
import { usersCollection, tuitionsCollection } from "../config/db";

const router = Router();

// GET /api/stats/public
router.get("/public", async (req: Request, res: Response) => {
  try {
    const users = await usersCollection();
    const tuitions = await tuitionsCollection();

    const filter = { approvalStatus: "approved", isActive: true };

    const totalTutors = await users.countDocuments({ role: "tutor" });
    const totalStudents = await users.countDocuments({ role: "student" });
    const totalTuitions = await tuitions.countDocuments(filter);

    // protita subject e koyta approved tuition ache
    const groups = await tuitions
      .aggregate([
        { $match: filter },
        { $group: { _id: "$subject", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const subjects: { name: string; count: number }[] = [];

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const subjectItem = {
        name: group._id as string,
        count: group.count as number,
      };
      subjects.push(subjectItem);
    }

    res.json({
      totalTutors: totalTutors,
      totalStudents: totalStudents,
      totalTuitions: totalTuitions,
      totalSubjects: subjects.length,
      subjects: subjects,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load stats" });
  }
});

export default router;