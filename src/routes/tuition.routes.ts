import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { tuitionsCollection, usersCollection } from "../config/db";
import { verifyToken, verifyTutor } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Free plan e max koyta tuition post kora jabe
const freePostLimit = 2;

const allowedSubjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Programming",
  "English",
  "IELTS",
  "Science",
];

const allowedClassLevels = [
  "Class 6-8",
  "SSC (9-10)",
  "HSC (11-12)",
  "University",
  "Professional",
];

const allowedModes = ["Online", "Offline"];

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

// POST /api/tuitions  (shudhu tutor)
router.post(
  "/",
  verifyToken,
  verifyTutor,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const title = String(req.body.title || "").trim();
      const subject = String(req.body.subject || "").trim();
      const classLevel = String(req.body.classLevel || "").trim();
      const mode = String(req.body.mode || "").trim();
      const location = String(req.body.location || "").trim();
      const description = String(req.body.description || "").trim();
      const bannerImage = String(req.body.bannerImage || "").trim();
      const monthlyFee = Number(req.body.monthlyFee);
      const daysPerWeek = Number(req.body.daysPerWeek);

      // Validation
      if (title.length < 5 || title.length > 100) {
        res
          .status(400)
          .json({ message: "Title must be between 5 and 100 characters" });
        return;
      }
      if (!allowedSubjects.includes(subject)) {
        res.status(400).json({ message: "Please select a valid subject" });
        return;
      }
      if (!allowedClassLevels.includes(classLevel)) {
        res.status(400).json({ message: "Please select a valid class level" });
        return;
      }
      if (!allowedModes.includes(mode)) {
        res.status(400).json({ message: "Mode must be Online or Offline" });
        return;
      }
      if (location === "") {
        res.status(400).json({ message: "Location is required" });
        return;
      }
      if (isNaN(monthlyFee) || monthlyFee < 100 || monthlyFee > 100000) {
        res
          .status(400)
          .json({ message: "Monthly fee must be between 100 and 100000 BDT" });
        return;
      }
      if (
        isNaN(daysPerWeek) ||
        daysPerWeek < 1 ||
        daysPerWeek > 7 ||
        !Number.isInteger(daysPerWeek)
      ) {
        res.status(400).json({ message: "Days per week must be 1 to 7" });
        return;
      }
      if (description.length < 30) {
        res
          .status(400)
          .json({ message: "Description must be at least 30 characters" });
        return;
      }
      if (!bannerImage.startsWith("http")) {
        res.status(400).json({ message: "Banner image is required" });
        return;
      }

      const tuitions = await tuitionsCollection();

      // Free plan limit
      if (user.plan !== "pro") {
        const posted = await tuitions.countDocuments({
          tutorEmail: user.email,
        });

        if (posted >= freePostLimit) {
          res.status(403).json({
            message:
              "Free plan allows up to " +
              freePostLimit +
              " tuition posts. Upgrade to Pro for unlimited posts.",
          });
          return;
        }
      }

      const newTuition = {
        title: title,
        subject: subject,
        classLevel: classLevel,
        mode: mode,
        location: location,
        monthlyFee: monthlyFee,
        daysPerWeek: daysPerWeek,
        bannerImage: bannerImage,
        description: description,
        tutorName: user.name,
        tutorEmail: user.email,
        approvalStatus: "pending",
        isActive: true,
        createdAt: new Date(),
      };

      await tuitions.insertOne(newTuition);

      res.status(201).json({
        message: "Tuition submitted. It will go live after admin approval.",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to post tuition" });
    }
  }
);

// GET /api/tuitions/my/usage  (tutor koyta post korechhe, limit koto)
router.get(
  "/my/usage",
  verifyToken,
  verifyTutor,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const tuitions = await tuitionsCollection();
      const posted = await tuitions.countDocuments({
        tutorEmail: user.email,
      });

      // Pro hole limit nai (null)
      let limit: number | null = freePostLimit;
      if (user.plan === "pro") {
        limit = null;
      }

      res.json({ posted: posted, limit: limit, plan: user.plan });
    } catch (error) {
      res.status(500).json({ message: "Failed to load usage" });
    }
  }
);

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