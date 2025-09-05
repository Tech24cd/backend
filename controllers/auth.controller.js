const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User, Mission } = require("../models");

// Inscription
const register = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email déjà utilisé." });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    await User.create({ nom, email, mot_de_passe: hash, role });
    res.status(201).json({ message: "Compte créé." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// Connexion
const login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const isValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!isValid) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 2 * 60 * 60 * 1000,
      })
      .json({
        message: "Connexion réussie.",
        user: { id: user.id, nom: user.nom, role: user.role },
      });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// 🔐 Missions pour admin
const getAllMissionsAdmin = async (req, res) => {
  try {
    const missions = await Mission.findAll({ include: ["user"] }); // Adapter si nécessaire
    res.status(200).json(missions);
  } catch (err) {
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des missions.",
    });
  }
};

// 🔐 Missions pour Presta
const getAllMissionsPrestataire = async (req, res) => {
  try {
    // L'ID du prestataire connecté est dans le token JWT
    const prestataireId = req.user.id; // req.user doit être rempli par ton middleware d'auth

    const missions = await Mission.findAll({
      where: { prestataireId }, // Filtre par le prestataire connecté
      include: ["user"],
    });

    res.status(200).json(missions);
  } catch (err) {
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des missions.",
    });
  }
};

module.exports = {
  register,
  login,
  getAllMissionsAdmin,
  getAllMissionsPrestataire,
};
