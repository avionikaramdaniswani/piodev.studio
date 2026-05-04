import { Router, type IRouter } from "express";
import healthRouter from "./health";
import iconsRouter from "./icons";
import meRouter from "./me";
import codesRouter from "./codes";
import redeemRouter from "./redeem";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/icons", iconsRouter);
router.use("/me", meRouter);
router.use("/admin/codes", codesRouter);
router.use("/redeem", redeemRouter);

export default router;
