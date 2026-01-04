import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()
console.log(typeof registerUser)

router.route("/register").post(registerUser)


export default router;