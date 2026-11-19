import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { tuitionsCollection, usersCollection } from "../config/db";

const router = Router();

// GET /api/tuitions?search=math&subject=Physics&classLevel=HSC (11-12)&mode=Online&page=1&limit=9
router.get("/", async (req: Request, res: Response) => {
  try {
    const tuitions = await tuitionsCollection();

    // URL theke value gulo nibo
    const search = String(req.query.search || "").trim();
    const subject = String(req.query.subject || "").trim();
    const classLevel = String(req.query.classLevel || "").trim();
    const mode = String(req.query.mode || "").trim();

    // page ar limit
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    let limit = Number(req.query.limit);
    if (isNaN(limit) || limit < 1) {
      limit = 9;
    }
    if (limit > 50) {
      limit = 50;
    }

    // shudhu approved ar active tuition
    const filter: Record<string, unknown> = {
      approvalStatus: "approved",
      isActive: true,
    };

    // Search: title ba subject e khuje dekhbe
    if (search !== "") {
      // special character thakle regex bhenge na jay
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { subject: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Filter
    if (subject !== "") {
      filter.subject = subject;
    }
    if (classLevel !== "") {
      filter.classLevel = classLevel;
    }
    if (mode !== "") {
      filter.mode = mode;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await tuitions.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const result = await tuitions
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({
      tuitions: result,
      total: total,
      page: page,
      limit: limit,
      totalPages: totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load tuitions" });
  }
});

// GET /api/tuitions/:id  (ei route shobsomoy file er shesh e thakbe)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!ObjectId.isValid(id)) {
      res.status(404).json({ message: "Tuition not found" });
      return;
    }

    const tuitions = await tuitionsCollection();

    const tuition = await tuitions.findOne({
      _id: new ObjectId(id),
      approvalStatus: "approved",
      isActive: true,
    });

    if (!tuition) {
      res.status(404).json({ message: "Tuition not found" });
      return;
    }

    // Tutor er profile info
    const users = await usersCollection();
    const tutorUser = await users.findOne({ email: tuition.tutorEmail });

    const totalTuitions = await tuitions.countDocuments({
      tutorEmail: tuition.tutorEmail,
      approvalStatus: "approved",
      isActive: true,
    });

    const tutor = {
      name: tuition.tutorName as string,
      email: tuition.tutorEmail as string,
      bio: "",
      image: "",
      plan: "free",
      totalTuitions: totalTuitions,
    };

    if (tutorUser) {
      tutor.name = tutorUser.name;
      if (tutorUser.bio) {
        tutor.bio = tutorUser.bio;
      }
      if (tutorUser.image) {
        tutor.image = tutorUser.image;
      }
      if (tutorUser.plan) {
        tutor.plan = tutorUser.plan;
      }
    }

    res.json({ tuition: tuition, tutor: tutor });
  } catch (error) {
    res.status(500).json({ message: "Failed to load tuition" });
  }
});

export default router;