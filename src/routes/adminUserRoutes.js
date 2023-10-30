import express from "express";
const router = express.Router();

import { authAdmin, logoutAdmin, registerAdmin } from "../controllers/adminUserController.js";

router.post("/authAdmin", authAdmin);
router.post("/registerAdmin", registerAdmin);
router.post("/logoutAdmin", logoutAdmin)

export default router;