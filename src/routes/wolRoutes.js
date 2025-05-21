import express from "express";
import { checkStatusHandler, sendWOLHandler } from "../controller/wolController.js";
import { checkInput } from "../middleware/wolMiddleware.js";

const router = express.Router();

router.post("/", checkInput, checkStatusHandler);
router.put("/", checkInput, sendWOLHandler);

export default router;
