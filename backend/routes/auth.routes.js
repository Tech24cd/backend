const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auth.controller");
const auth = require("../middlewares/auth.middleware");

// Pour vérifier ce que contient ctrl
console.log(
  "Auth Controller functions:",
  typeof ctrl.register,
  typeof ctrl.login
);

// Inscription
router.post("/register", ctrl.register);

// Connexion
router.post("/login", ctrl.login);

// Route réservée aux Admin
router.get("/admin", auth(["admin"]), ctrl.getAllMissionsAdmin);

module.exports = router;
