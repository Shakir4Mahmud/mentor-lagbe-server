import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import {
  tuitionsCollection,
  applicationsCollection,
  usersCollection,
} from "../config/db";
import { verifyToken, verifyTutor } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Free plan e max koyta tuition post kora jay
const freePostLimit = 2;

function twoDigits(number: number) {
  if (number < 10) {
    return "0" + number;
  }
  return String(number);
}

// GET /api/tutor/stats  (overview er shob data ek shathe)
router.get(
  "/stats",
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
      const applications = await applicationsCollection();

      const myTuitions = await tuitions
        .find({ tutorEmail: user.email })
        .toArray();

      const myApplications = await applications
        .find({ tutorEmail: user.email })
        .sort({ appliedAt: -1 })
        .toArray();

      // Tuition er count
      let approved = 0;
      let pending = 0;
      let rejected = 0;
      let live = 0;

      for (let i = 0; i < myTuitions.length; i++) {
        const tuition = myTuitions[i];

        if (tuition.approvalStatus === "approved") {
          approved = approved + 1;
          if (tuition.isActive) {
            live = live + 1;
          }
        }
        if (tuition.approvalStatus === "pending") {
          pending = pending + 1;
        }
        if (tuition.approvalStatus === "rejected") {
          rejected = rejected + 1;
        }
      }

      // Application er status count
      let appPending = 0;
      let appAccepted = 0;
      let appRejected = 0;

      for (let i = 0; i < myApplications.length; i++) {
        const status = myApplications[i].status;

        if (status === "pending") {
          appPending = appPending + 1;
        }
        if (status === "accepted") {
          appAccepted = appAccepted + 1;
        }
        if (status === "rejected") {
          appRejected = appRejected + 1;
        }
      }

      // Last 7 diner application count (chart er jonno)
      const weekly = [];

      for (let i = 6; i >= 0; i--) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        let count = 0;
        for (let j = 0; j < myApplications.length; j++) {
          const appliedAt = new Date(myApplications[j].appliedAt);
          if (appliedAt >= start && appliedAt < end) {
            count = count + 1;
          }
        }

        const dateText =
          start.getFullYear() +
          "-" +
          twoDigits(start.getMonth() + 1) +
          "-" +
          twoDigits(start.getDate());

        weekly.push({ date: dateText, count: count });
      }

      // Kon tuition e koto applicant
      const topList = [];

      for (let i = 0; i < myTuitions.length; i++) {
        const tuitionId = myTuitions[i]._id.toString();

        let count = 0;
        for (let j = 0; j < myApplications.length; j++) {
          if (myApplications[j].tuitionId === tuitionId) {
            count = count + 1;
          }
        }

        if (count > 0) {
          topList.push({ title: myTuitions[i].title as string, count: count });
        }
      }

      topList.sort((a, b) => b.count - a.count);
      const topTuitions = topList.slice(0, 4);

      // Shesh 5 ta applicant
      const recent = [];
      const recentLimit = Math.min(5, myApplications.length);

      for (let i = 0; i < recentLimit; i++) {
        const item = myApplications[i];
        recent.push({
          _id: item._id.toString(),
          studentName: item.studentName,
          tuitionTitle: item.tuitionTitle,
          status: item.status,
          appliedAt: item.appliedAt,
        });
      }

      // Pro hole limit nai (null)
      let postLimit: number | null = freePostLimit;
      if (user.plan === "pro") {
        postLimit = null;
      }

      res.json({
        totalPosted: myTuitions.length,
        live: live,
        approved: approved,
        pending: pending,
        rejected: rejected,
        totalApplicants: myApplications.length,
        applicationStatus: {
          pending: appPending,
          accepted: appAccepted,
          rejected: appRejected,
        },
        weekly: weekly,
        topTuitions: topTuitions,
        recent: recent,
        plan: user.plan,
        postLimit: postLimit,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load stats" });
    }
  }
);

// GET /api/tutor/applicants  (tutor er tuition e ashha shob application)
router.get(
  "/applicants",
  verifyToken,
  verifyTutor,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const applications = await applicationsCollection();
      const list = await applications
        .find({ tutorEmail: user.email })
        .sort({ appliedAt: -1 })
        .toArray();

      // Student der profile photo ber kori
      const emails: string[] = [];
      for (let i = 0; i < list.length; i++) {
        const email = list[i].studentEmail as string;
        if (!emails.includes(email)) {
          emails.push(email);
        }
      }

      const users = await usersCollection();
      const students = await users.find({ email: { $in: emails } }).toArray();

      const result = [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        let studentImage = "";
        for (let j = 0; j < students.length; j++) {
          if (students[j].email === item.studentEmail && students[j].image) {
            studentImage = students[j].image;
          }
        }

        result.push({ ...item, studentImage: studentImage });
      }

      res.json({ applications: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to load applicants" });
    }
  }
);

// PATCH /api/tutor/applicants/:id/status  (Accepted ba Rejected)
router.patch(
  "/applicants/:id/status",
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
        res.status(400).json({ message: "Invalid application id" });
        return;
      }

      const status = String(req.body.status || "");
      if (status !== "accepted" && status !== "rejected") {
        res
          .status(400)
          .json({ message: "Status must be accepted or rejected" });
        return;
      }

      const applications = await applicationsCollection();

      // Onno tutor er applicant e hat deya jabe na
      const application = await applications.findOne({
        _id: new ObjectId(id),
        tutorEmail: user.email,
      });

      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }

      await applications.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: status } }
      );

      res.json({ message: "Application " + status });
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  }
);

export default router;