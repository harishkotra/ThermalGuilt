import { Router } from "express";
import { requestCibaApproval } from "../services/auth0.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const thermostatRouter = Router();

thermostatRouter.post("/adjust", asyncHandler(async (req, res) => {
  const user = req.authUser!;
  const { targetTemp, reason } = req.body as { targetTemp: number; reason: string };

  const ciba = await requestCibaApproval(user.userId, `Set thermostat to ${targetTemp}F: ${reason}`);

  res.status(202).json({
    status: "awaiting_user_approval",
    ciba,
    proposedAdjustment: {
      targetTemp,
      reason
    }
  });
}));
