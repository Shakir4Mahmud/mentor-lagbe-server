import { Router, Response } from "express";
import { ObjectId } from "mongodb";
import { tuitionsCollection, usersCollection } from "../config/db";
import { verifyToken, verifyStudent } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

// Free plan e max koyta save kora jabe
const freeSaveLimit = 5;

// Save kora tuition er id list ber korar helper
async function getSavedIds(email: string): Promise<string[]> {
  const users = await usersCollection();
  const user = await users.findOne({ email: email });

  let ids: string[] = [];
  if (user && Array.isArray(user.savedTuitions)) {
    ids = user.savedTuitions;
  }

  return ids;
}

// GET /api/bookmarks  (shudhu id gulo)
router.get(
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

      const ids = await getSavedIds(user.email);
      res.json({ ids: ids });
    } catch (error) {
      res.status(500).json({ message: "Failed to load saved tuitions" });
    }
  }
);

// GET /api/bookmarks/tuitions  (pura tuition, newest saved age)
router.get(
  "/tuitions",
  verifyToken,
  verifyStudent,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const ids = await getSavedIds(user.email);

      const objectIds: ObjectId[] = [];
      for (let i = 0; i < ids.length; i++) {
        if (ObjectId.isValid(ids[i])) {
          objectIds.push(new ObjectId(ids[i]));
        }
      }

      const tuitions = await tuitionsCollection();
      const found = await tuitions
        .find({
          _id: { $in: objectIds },
          approvalStatus: "approved",
          isActive: true,
        })
        .toArray();

      // Jeta shesh e save korechhe seta age dekhabo
      const ordered = [];
      for (let i = ids.length - 1; i >= 0; i--) {
        for (let j = 0; j < found.length; j++) {
          if (found[j]._id.toString() === ids[i]) {
            ordered.push(found[j]);
          }
        }
      }

      res.json({ tuitions: ordered });
    } catch (error) {
      res.status(500).json({ message: "Failed to load saved tuitions" });
    }
  }
);

// POST /api/bookmarks/:tuitionId  (save kora)
router.post(
  "/:tuitionId",
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

      if (!ObjectId.isValid(tuitionId)) {
        res.status(400).json({ message: "Invalid tuition id" });
        return;
      }

      // Tuition ache kina dekhbo
      const tuitions = await tuitionsCollection();
      const tuition = await tuitions.findOne({
        _id: new ObjectId(tuitionId),
        approvalStatus: "approved",
        isActive: true,
      });

      if (!tuition) {
        res.status(404).json({ message: "Tuition not found" });
        return;
      }

      const savedIds = await getSavedIds(user.email);

      // Age thekei save kora thakle abar korbo na
      if (savedIds.includes(tuitionId)) {
        res.json({ message: "Already saved" });
        return;
      }

      // Free plan limit
      if (user.plan !== "pro" && savedIds.length >= freeSaveLimit) {
        res.status(403).json({
          message:
            "Free plan allows up to " +
            freeSaveLimit +
            " saved tuitions. Upgrade to Pro for unlimited.",
        });
        return;
      }

      // Notun id list er shesh e jog kore pura list save korbo
      const newIds = savedIds.concat([tuitionId]);

      const users = await usersCollection();
      await users.updateOne(
        { email: user.email },
        { $set: { savedTuitions: newIds } }
      );

      res.status(201).json({ message: "Tuition saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save tuition" });
    }
  }
);

// DELETE /api/bookmarks/:tuitionId  (remove kora)
router.delete(
  "/:tuitionId",
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

      const savedIds = await getSavedIds(user.email);

      // Ei id ta bad diye baki gulo rakhbo
      const remainingIds = savedIds.filter((id) => id !== tuitionId);

      const users = await usersCollection();
      await users.updateOne(
        { email: user.email },
        { $set: { savedTuitions: remainingIds } }
      );

      res.json({ message: "Tuition removed from saved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove tuition" });
    }
  }
);

export default router;