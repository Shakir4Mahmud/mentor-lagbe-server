import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import { applicationsCollection } from "../config/db";
import { verifyToken, verifyStudent } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// POST /api/reviews/:applicationId  (shudhu accepted student)
router.post(
  "/:applicationId",
  verifyToken,
  verifyStudent,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const id = String(req.params.applicationId);
      if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: "Invalid application id" });
        return;
      }

      const rating = Number(req.body.rating);
      const review = String(req.body.review || "").trim();

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        res
          .status(400)
          .json({ message: "Rating must be a whole number from 1 to 5" });
        return;
      }

      if (review.length < 10 || review.length > 500) {
        res
          .status(400)
          .json({ message: "Review must be between 10 and 500 characters" });
        return;
      }

      const applications = await applicationsCollection();

      // Onner application e review dewa jabe na
      const application = await applications.findOne({
        _id: new ObjectId(id),
        studentEmail: user.email,
      });

      if (!application) {
        res.status(404).json({ message: "Application not found" });
        return;
      }

      // Shudhu accepted hole review dewa jabe
      if (application.status !== "accepted") {
        res.status(403).json({
          message: "You can review a tuition only after your application is accepted",
        });
        return;
      }

      // Ek application e ekbar-i review
      if (typeof application.rating === "number") {
        res
          .status(409)
          .json({ message: "You have already reviewed this tuition" });
        return;
      }

      await applications.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            rating: rating,
            review: review,
            reviewedAt: new Date(),
          },
        }
      );

      res.status(201).json({ message: "Review submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit review" });
    }
  }
);

export default router;