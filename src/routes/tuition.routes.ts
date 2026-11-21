import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  tuitionsCollection,
  usersCollection,
  applicationsCollection,
} from "../config/db";
import { verifyToken, verifyTutor } from "../middleware/auth";
import { AuthRequest } from "../types";
import { getRatingSummaries, getTuitionReviews } from "../utils/rating";

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

type TuitionInput = {
  title: string;
  subject: string;
  classLevel: string;
  mode: string;
  location: string;
  monthlyFee: number;
  daysPerWeek: number;
  description: string;
  bannerImage: string;
};

type ReadResult = {
  error: string;
  data: TuitionInput | null;
};

// Post ar Edit duto-i ei function diye validate hobe
function readTuitionBody(body: Record<string, unknown>): ReadResult {
  const title = String(body.title || "").trim();
  const subject = String(body.subject || "").trim();
  const classLevel = String(body.classLevel || "").trim();
  const mode = String(body.mode || "").trim();
  const location = String(body.location || "").trim();
  const description = String(body.description || "").trim();
  const bannerImage = String(body.bannerImage || "").trim();
  const monthlyFee = Number(body.monthlyFee);
  const daysPerWeek = Number(body.daysPerWeek);

  if (title.length < 5 || title.length > 100) {
    return { error: "Title must be between 5 and 100 characters", data: null };
  }
  if (!allowedSubjects.includes(subject)) {
    return { error: "Please select a valid subject", data: null };
  }
  if (!allowedClassLevels.includes(classLevel)) {
    return { error: "Please select a valid class level", data: null };
  }
  if (!allowedModes.includes(mode)) {
    return { error: "Mode must be Online or Offline", data: null };
  }
  if (location === "") {
    return { error: "Location is required", data: null };
  }
  if (isNaN(monthlyFee) || monthlyFee < 100 || monthlyFee > 100000) {
    return {
      error: "Monthly fee must be between 100 and 100000 BDT",
      data: null,
    };
  }
  if (
    isNaN(daysPerWeek) ||
    daysPerWeek < 1 ||
    daysPerWeek > 7 ||
    !Number.isInteger(daysPerWeek)
  ) {
    return { error: "Days per week must be 1 to 7", data: null };
  }
  if (description.length < 30) {
    return {
      error: "Description must be at least 30 characters",
      data: null,
    };
  }
  if (!bannerImage.startsWith("http")) {
    return { error: "Banner image is required", data: null };
  }

  const data: TuitionInput = {
    title: title,
    subject: subject,
    classLevel: classLevel,
    mode: mode,
    location: location,
    monthlyFee: monthlyFee,
    daysPerWeek: daysPerWeek,
    description: description,
    bannerImage: bannerImage,
  };

  return { error: "", data: data };
}

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

    // Prottek tuition er average rating jog kori
    const ids: string[] = [];
    for (let i = 0; i < result.length; i++) {
      ids.push(result[i]._id.toString());
    }

    const ratingMap = await getRatingSummaries(ids);

    const withRating = [];
    for (let i = 0; i < result.length; i++) {
      const item = result[i];

      let ratingAverage = 0;
      let ratingCount = 0;

      const summary = ratingMap[item._id.toString()];
      if (summary) {
        ratingAverage = summary.average;
        ratingCount = summary.count;
      }

      withRating.push({
        ...item,
        ratingAverage: ratingAverage,
        ratingCount: ratingCount,
      });
    }

    res.json({
      tuitions: withRating,
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

      const result = readTuitionBody(req.body);
      if (result.error !== "" || !result.data) {
        res.status(400).json({ message: result.error });
        return;
      }
      const input = result.data;

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
        ...input,
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

// GET /api/tuitions/my  (tutor er nijer shob tuition, applicant count shoho)
router.get(
  "/my",
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
      const list = await tuitions
        .find({ tutorEmail: user.email })
        .sort({ createdAt: -1 })
        .toArray();

      // Protita tuition e koyta application, seta ber kori
      const applications = await applicationsCollection();
      const counts = await applications
        .aggregate([
          { $match: { tutorEmail: user.email } },
          { $group: { _id: "$tuitionId", count: { $sum: 1 } } },
        ])
        .toArray();

      const result = [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        let applicantCount = 0;
        for (let j = 0; j < counts.length; j++) {
          if (counts[j]._id === item._id.toString()) {
            applicantCount = counts[j].count as number;
          }
        }

        result.push({ ...item, applicantCount: applicantCount });
      }

      res.json({ tuitions: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to load your tuitions" });
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

// PATCH /api/tuitions/:id  (tutor nijer tuition edit korbe)
router.patch(
  "/:id",
  verifyToken,
  verifyTutor,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid tuition id" });
        return;
      }

      const tuitions = await tuitionsCollection();

      // Onner tuition edit kora jabe na
      const existing = await tuitions.findOne({
        _id: new ObjectId(id),
        tutorEmail: user.email,
      });

      if (!existing) {
        res.status(404).json({ message: "Tuition not found" });
        return;
      }

      const result = readTuitionBody(req.body);
      if (result.error !== "" || !result.data) {
        res.status(400).json({ message: result.error });
        return;
      }
      const input = result.data;

      // Edit korle abar admin review lagbe.
      // Eta chaile na hole ei line e "pending" er bodole existing.approvalStatus likho
      const updateFields = {
        ...input,
        approvalStatus: "pending",
        updatedAt: new Date(),
      };

      await tuitions.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
      );

      const updated = await tuitions.findOne({ _id: new ObjectId(id) });

      res.json({
        message: "Tuition updated. Admin will review it again.",
        tuition: updated,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update tuition" });
    }
  }
);

// PATCH /api/tuitions/:id/status  (Active / Closed toggle)
router.patch(
  "/:id/status",
  verifyToken,
  verifyTutor,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid tuition id" });
        return;
      }

      if (typeof req.body.isActive !== "boolean") {
        res.status(400).json({ message: "isActive must be true or false" });
        return;
      }

      const tuitions = await tuitionsCollection();

      const existing = await tuitions.findOne({
        _id: new ObjectId(id),
        tutorEmail: user.email,
      });

      if (!existing) {
        res.status(404).json({ message: "Tuition not found" });
        return;
      }

      await tuitions.updateOne(
        { _id: new ObjectId(id) },
        { $set: { isActive: req.body.isActive } }
      );

      res.json({ message: "Status updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  }
);

// DELETE /api/tuitions/:id  (tuition ar tar shob application muche jabe)
router.delete(
  "/:id",
  verifyToken,
  verifyTutor,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid tuition id" });
        return;
      }

      const tuitions = await tuitionsCollection();

      const existing = await tuitions.findOne({
        _id: new ObjectId(id),
        tutorEmail: user.email,
      });

      if (!existing) {
        res.status(404).json({ message: "Tuition not found" });
        return;
      }

      await tuitions.deleteOne({ _id: new ObjectId(id) });

      // Ei tuition er application gulo o muche felbo
      const applications = await applicationsCollection();
      await applications.deleteMany({ tuitionId: id });

      res.json({ message: "Tuition deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete tuition" });
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

    // Ei tuition er review ar average rating
    const reviewData = await getTuitionReviews(id);

    res.json({
      tuition: tuition,
      tutor: tutor,
      reviews: reviewData.reviews,
      rating: reviewData.summary,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load tuition" });
  }
});

export default router;