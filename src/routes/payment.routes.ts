import { Router, Response } from "express";
import Stripe from "stripe";
import { usersCollection, paymentsCollection } from "../config/db";
import { verifyToken } from "../middleware/auth";
import { AuthRequest } from "../types";

const router = Router();

type PlanInfo = {
  name: string;
  description: string;
  prices: Record<string, number>;
};

// Role dekhe plan thik hobe, client theke dam ashbe na
const plans: Record<string, PlanInfo> = {
  student: {
    name: "Pro Student",
    description: "Priority booking, Pro badge and unlimited saved tuitions",
    prices: { bdt: 99, usd: 1 },
  },
  tutor: {
    name: "Pro Tutor",
    description: "Unlimited tuition posts and a verified badge",
    prices: { bdt: 499, usd: 5 },
  },
};

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing in .env");
  }

  return new Stripe(key);
}

function getCurrency() {
  const currency = String(process.env.STRIPE_CURRENCY || "bdt").toLowerCase();

  if (currency === "usd") {
    return "usd";
  }
  return "bdt";
}

// POST /api/payments/create-checkout-session
router.post(
  "/create-checkout-session",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (user.role !== "student" && user.role !== "tutor") {
        res
          .status(403)
          .json({ message: "Only students and tutors can buy a Pro plan" });
        return;
      }

      if (user.plan === "pro") {
        res.status(400).json({ message: "You are already on the Pro plan" });
        return;
      }

      const plan = plans[user.role];
      const currency = getCurrency();
      const price = plan.prices[currency];

      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: currency,
              unit_amount: price * 100,
              product_data: {
                name: plan.name,
                description: plan.description,
              },
            },
          },
        ],
        metadata: {
          userEmail: user.email,
          userRole: user.role,
          planName: plan.name,
        },
        success_url:
          clientUrl + "/payment/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: clientUrl + "/payment/cancel",
      });

      if (!session.url) {
        res.status(500).json({ message: "Stripe did not return a payment link" });
        return;
      }

      res.json({ url: session.url });
    } catch (error) {
      const err = error as Error;
      res
        .status(500)
        .json({ message: "Could not start checkout. " + err.message });
    }
  }
);

// POST /api/payments/verify  (Stripe theke ferot asar por)
router.post(
  "/verify",
  verifyToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const sessionId = String(req.body.sessionId || "").trim();
      if (!sessionId.startsWith("cs_")) {
        res.status(400).json({ message: "Invalid payment session" });
        return;
      }

      // Stripe ke jiggesh kori payment sotti hoyeche kina
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      const metadata = session.metadata;

      let sessionEmail = "";
      if (metadata && metadata.userEmail) {
        sessionEmail = metadata.userEmail;
      }

      // Onner payment diye nijer account Pro kora jabe na
      if (sessionEmail !== user.email) {
        res
          .status(403)
          .json({ message: "This payment does not belong to your account" });
        return;
      }

      if (session.payment_status !== "paid") {
        res.status(400).json({ message: "Payment is not completed yet" });
        return;
      }

      let transactionId = session.id;
      if (typeof session.payment_intent === "string") {
        transactionId = session.payment_intent;
      }

      let amount = 0;
      if (session.amount_total) {
        amount = session.amount_total / 100;
      }

      let currency = "bdt";
      if (session.currency) {
        currency = session.currency;
      }

      let planName = "Pro";
      if (metadata && metadata.planName) {
        planName = metadata.planName;
      }

      let userRole = user.role;
      if (metadata && metadata.userRole) {
        userRole = metadata.userRole;
      }

      const payments = await paymentsCollection();

      // Ek session e ekbar-i record hobe
      await payments.createIndex(
        { stripeSessionId: 1 },
        {
          unique: true,
          partialFilterExpression: { stripeSessionId: { $type: "string" } },
        }
      );

      const newPayment = {
        userEmail: user.email,
        userName: user.name,
        userRole: userRole,
        planName: planName,
        amount: amount,
        currency: currency,
        transactionId: transactionId,
        stripeSessionId: sessionId,
        paymentStatus: "paid",
        paidAt: new Date(),
      };

      try {
        await payments.insertOne(newPayment);
      } catch (insertError) {
        // 11000 mane ei session age-i save hoye gechhe, eta thik ache
        const code = (insertError as { code?: number }).code;
        if (code !== 11000) {
          throw insertError;
        }
      }

      // User er plan Pro kore dei
      const users = await usersCollection();
      await users.updateOne(
        { email: user.email },
        { $set: { plan: "pro", updatedAt: new Date() } }
      );

      const savedPayment = await payments.findOne({ stripeSessionId: sessionId });

      res.json({ message: "Payment verified", payment: savedPayment });
    } catch (error) {
      const err = error as Error;
      res
        .status(500)
        .json({ message: "Could not verify payment. " + err.message });
    }
  }
);

export default router;