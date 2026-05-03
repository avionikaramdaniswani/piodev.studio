import { Router, type IRouter } from "express";
import healthRouter from "./health";
import iconsRouter from "./icons";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/icons", iconsRouter);

export default router;
