import express from "express";
import { merchantService } from "../services/merchantService.js";
import { requireApiKeyAuth } from "../lib/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/webhooks/test:
 *   post:
 *     summary: Send a test webhook to the merchant's stored webhook URL
 *     tags: [Webhooks]
 *     security:
 *       - ApiKeyAuth: []
 */
router.post("/webhooks/test", requireApiKeyAuth(), async (req, res, next) => {
  try {
    const result = await merchantService.testWebhook(req.merchant, req.merchant.webhook_url);
    
    if (!req.merchant.webhook_url) {
      return res.status(400).json({ error: "No webhook URL configured for this merchant." });
    }

    res.json({
      ok: result.ok,
      status: result.status,
      body: result.body,
      signed: result.signed,
    });
  } catch (err) {
    next(err);
  }
});

export default router;