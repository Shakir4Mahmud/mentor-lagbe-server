import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import {
  tuitionsCollection,
  applicationsCollection,
  usersCollection,
} from "../config/db";
import { verifyToken, verifyStudent } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// POST /api/applications  (shudhu student)
router.post(
  "/",
  verifyToken,
  verifyStudent,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const tuitionId = String(req.body.tuitionId || "");
      const studentPhone = String(req.body.studentPhone || "").trim();
      const preferredSchedule = String(req.body.preferredSchedule || "").trim();
      const studentNote = String(req.body.studentNote || "").trim();

      // Validation
      if (!ObjectId.isValid(tuitionId)) {
        res.status(400).json({ message: "Invalid tuition id" });
        return;
      }
      if (studentPhone === "") {
        res.status(400).json({ message: "Phone number is required" });
        return;
      }
      if (preferredSchedule === "") {
        res.status(400).json({ message: "Preferred schedule is required" });
        return;
      }
      if (studentNote.length < 10) {
        res
          .status(400)
          .json({ message: "Learning note must be at least 10 characters" });
        return;
      }

      // Tuition ache kina, approved ar active kina
      const tuitions = await tuitionsCollection();
      const tuition = await tuitions.findOne({
        _id: new ObjectId(tuitionId),
        approvalStatus: "approved",
        isActive: true,
      });

      if (!tuition) {
        res
          .status(404)
          .json({ message: "This tuition is not available for applications" });
        return;
      }

      // Duplicate application block
      const applications = await applicationsCollection();
      const existing = await applications.findOne({
        tuitionId: tuitionId,
        studentEmail: user.email,
      });

      if (existing) {
        res
          .status(409)
          .json({ message: "You have already applied for this tuition" });
        return;
      }

      const newApplication = {
        tuitionId: tuitionId,
        tuitionTitle: tuition.title,
        subject: tuition.subject,
        monthlyFee: tuition.monthlyFee,
        tutorEmail: tuition.tutorEmail,
        studentName: user.name,
        studentEmail: user.email,
        studentPhone: studentPhone,
        preferredSchedule: preferredSchedule,
        studentNote: studentNote,
        status: "pending",
        appliedAt: new Date(),
      };

      await applications.insertOne(newApplication);

      res.status(201).json({ message: "Application submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit application" });
    }
  }
);

// GET /api/applications/check/:tuitionId  (student ager apply korechhe kina)
router.get(
  "/check/:tuitionId",
  verifyToken,
  verifyStudent,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const tuitionId = String(req.params.tuitionId);

      const applications = await applicationsCollection();
      const existing = await applications.findOne({
        tuitionId: tuitionId,
        studentEmail: user.email,
      });

      if (existing) {
        res.json({ applied: true, status: existing.status });
        return;
      }

      res.json({ applied: false, status: "" });
    } catch (error) {
      res.status(500).json({ message: "Failed to check application" });
    }
  }
);

// GET /api/applications/my  (student er shob application, notun age)
router.get(
  "/my",
  verifyToken,
  verifyStudent,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const applications = await applicationsCollection();
      const list = await applications
        .find({ studentEmail: user.email })
        .sort({ appliedAt: -1 })
        .toArray();

      // Tutor der naam ber korar jonno email gulo joma kori
      const tutorEmails: string[] = [];
      for (let i = 0; i < list.length; i++) {
        const email = list[i].tutorEmail as string;
        if (!tutorEmails.includes(email)) {
          tutorEmails.push(email);
        }
      }

      const users = await usersCollection();
      const tutors = await users.find({ email: { $in: tutorEmails } }).toArray();

      // Protita application e tutorName jog kori
      const result = [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        let tutorName = item.tutorEmail as string;
        for (let j = 0; j < tutors.length; j++) {
          if (tutors[j].email === item.tutorEmail) {
            tutorName = tutors[j].name;
          }
        }

        result.push({ ...item, tutorName: tutorName });
      }

      res.json({ applications: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to load applications" });
    }
  }
);

// GET /api/applications/stats  (student dashboard er 4 ta stat)
router.get(
  "/stats",
  verifyToken,
  verifyStudent,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const applications = await applicationsCollection();

      const total = await applications.countDocuments({
        studentEmail: user.email,
      });
      const accepted = await applications.countDocuments({
        studentEmail: user.email,
        status: "accepted",
      });
      const pending = await applications.countDocuments({
        studentEmail: user.email,
        status: "pending",
      });
      const rejected = await applications.countDocuments({
        studentEmail: user.email,
        status: "rejected",
      });

      res.json({
        total: total,
        accepted: accepted,
        pending: pending,
        rejected: rejected,
        plan: user.plan,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load stats" });
    }
  }
);

// DELETE /api/applications/:id  (shudhu nijer pending application cancel)
router.delete(
  "/:id",
  verifyToken,
  verifyStudent,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const id = String(req.params.id);

      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid application id" });
        return;
      }

      const applications = await applicationsCollection();

      // Onno student er application cancel kora jabe na
      const application = await applications.findOne({
        _id: new ObjectId(id),
        studentEmail: user.email,
      });

      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }

      if (application.status !== "pending") {
        res
          .status(400)
          .json({ message: "Only pending applications can be cancelled" });
        return;
      }

      await applications.deleteOne({ _id: new ObjectId(id) });

      res.json({ message: "Application cancelled" });
    } catch (error) {
      res.status(500).json({ message: "Failed to cancel application" });
    }
  }
);

export default router;