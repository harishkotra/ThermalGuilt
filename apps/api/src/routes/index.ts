import { Router } from "express";
import { requireScope } from "../middleware/auth.js";
import { aiRouter } from "./ai.js";
import { energyRouter } from "./energy.js";
import { leaderboardRouter } from "./leaderboard.js";
import { solanaRouter } from "./solana.js";
import { thermostatRouter } from "./thermostat.js";

export const apiRouter = Router();

apiRouter.use("/energy", requireScope("read:energy"), energyRouter);
apiRouter.use("/ai", requireScope("read:energy"), aiRouter);
apiRouter.use("/leaderboard", requireScope("read:neighborhood"), leaderboardRouter);
apiRouter.use("/solana", solanaRouter);
apiRouter.use("/thermostat", requireScope("write:thermostat"), thermostatRouter);
