import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import {
  usersCollection,
  tuitionsCollection,
  paymentsCollection,
} from "../config/db";
import { verifyToken, verifyAdmin } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

const allowedRoles = ["student", "tutor", "admin"];

function twoDigits(number: number) {
  if (number < 10) {
    return "0" + number;
  }
  return String(number);
}

// GET /api/admin/stats  (overview er shob data)
router.get(
  "/stats",
  verifyToken,
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await usersCollection();
      const tuitions = await tuitionsCollection();
      const payments = await paymentsCollection();

      // User er count
      const totalUsers = await users.countDocuments({});
      const totalStudents = await users.countDocuments({ role: "student" });
      const totalTutors = await users.countDocuments({ role: "tutor" });
      const totalAdmins = await users.countDocuments({ role: "admin" });
      const proUsers = await users.countDocuments({ plan: "pro" });

      // Tuition er count
      const approved = await tuitions.countDocuments({
        approvalStatus: "approved",
      });
      const pending = await tuitions.countDocuments({
        approvalStatus: "pending",
      });
      const rejected = await tuitions.countDocuments({
        approvalStatus: "rejected",
      });

      // Stripe revenue (payments collection theke)
      const paidPayments = await payments
        .find({ paymentStatus: "paid" })
        .toArray();

      let revenue = 0;
      for (let i = 0; i < paidPayments.length; i++) {
        revenue = revenue + Number(paidPayments[i].amount);
      }

      // Last 7 diner notun signup (seed user bad)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const newUsers = await users
        .find({
          createdAt: { $gte: sevenDaysAgo },
          isSeed: { $ne: true },
        })
        .toArray();

      const weekly = [];

      for (let i = 6; i >= 0; i--) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i);

        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        let count = 0;
        for (let j = 0; j < newUsers.length; j++) {
          const createdAt = new Date(newUsers[j].createdAt);
          if (createdAt >= start && createdAt < end) {
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

      // Approval er opekkhay thaka tuition (notun age)
      const pendingTuitions = await tuitions
        .find({ approvalStatus: "pending" })
        .sort({ createdAt: -1 })
        .limit(4)
        .toArray();

      const pendingList = [];
      for (let i = 0; i < pendingTuitions.length; i++) {
        const item = pendingTuitions[i];
        pendingList.push({
          _id: item._id.toString(),
          title: item.title,
          tutorName: item.tutorName,
          createdAt: item.createdAt,
        });
      }

      // Shesh 5 jon notun user
      const latestUsers = await users
        .find(
          {},
          {
            projection: {
              name: 1,
              email: 1,
              role: 1,
              image: 1,
              createdAt: 1,
            },
          }
        )
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      const recentUsers = [];
      for (let i = 0; i < latestUsers.length; i++) {
        const item = latestUsers[i];
        recentUsers.push({
          _id: item._id.toString(),
          name: item.name,
          email: item.email,
          role: item.role || "student",
          image: item.image || "",
          createdAt: item.createdAt,
        });
      }

      res.json({
        totalUsers: totalUsers,
        totalStudents: totalStudents,
        totalTutors: totalTutors,
        totalAdmins: totalAdmins,
        proUsers: proUsers,
        approved: approved,
        pending: pending,
        rejected: rejected,
        revenue: revenue,
        transactions: paidPayments.length,
        weekly: weekly,
        pendingList: pendingList,
        recentUsers: recentUsers,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to load admin stats" });
    }
  }
);

// GET /api/admin/users  (shob user)
router.get(
  "/users",
  verifyToken,
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const users = await usersCollection();

      const list = await users
        .find(
          {},
          {
            projection: {
              name: 1,
              email: 1,
              image: 1,
              role: 1,
              plan: 1,
              phone: 1,
              createdAt: 1,
            },
          }
        )
        .sort({ createdAt: -1 })
        .toArray();

      const result = [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        result.push({
          _id: item._id.toString(),
          name: item.name,
          email: item.email,
          image: item.image || "",
          role: item.role || "student",
          plan: item.plan || "free",
          phone: item.phone || "",
          createdAt: item.createdAt,
        });
      }

      res.json({ users: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to load users" });
    }
  }
);

// PATCH /api/admin/users/:id/role  (role bodlano)
router.patch(
  "/users/:id/role",
  verifyToken,
  verifyAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const admin = req.user;
      if (!admin) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const id = String(req.params.id);
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid user id" });
        return;
      }

      const role = String(req.body.role || "");
      if (!allowedRoles.includes(role)) {
        res
          .status(400)
          .json({ message: "Role must be student, tutor or admin" });
        return;
      }

      // Admin nijer role nijei bodlate parbe na
      if (id === admin.id) {
        res.status(400).json({ message: "You cannot change your own role" });
        return;
      }

      const users = await usersCollection();
      const target = await users.findOne({ _id: new ObjectId(id) });

      if (!target) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: role, updatedAt: new Date() } }
      );

      res.json({ message: "Role updated to " + role });
    } catch (error) {
      res.status(500).json({ message: "Failed to update role" });
    }
  }
);

export default router;