const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.patch("/updatePassword", auth.protect, authController.updatePassword);

router.get("/me", auth.protect, userController.getMe);

module.exports = router;
