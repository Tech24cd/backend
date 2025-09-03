const express = require("express");
const router = express.Router();
const { User } = require("../models");
const { getTechniciens } = require("../controllers/user.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/techniciens", getTechniciens);
// Récupérer les techniciens
router.get("/techniciens", auth(), async (req, res) => {
  try {
    const techniciens = await User.findAll({
      where: { role: "technicien" },
      attributes: ["id", "nom", "email", "telephone"],
    });
    res.json(techniciens);
  } catch (err) {
    console.error("Erreur techniciens :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour récupérer les prestataires
router.get("/prestataires", auth(), async (req, res) => {
  try {
    const prestataires = await User.findAll({
      where: { role: "prestataire" },
      attributes: ["id", "nom", "email", "telephone"],
    });
    res.json(prestataires);
  } catch (err) {
    console.error("Erreur prestataires :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Créer un utilisateur (POST /api/users)
router.post(
  "/",
  /* auth(), */ async (req, res) => {
    try {
      const { nom, email, telephone, role } = req.body;
      if (!nom || !email) {
        return res.status(400).json({ message: "Nom et email requis" });
      }
      const newUser = await User.create({ nom, email, telephone, role });
      res.status(201).json(newUser);
    } catch (err) {
      console.error("Erreur création utilisateur :", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

module.exports = router;
