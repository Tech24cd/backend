// controllers/user.controller.js
const { User } = require("../models");

exports.getTechniciens = async (req, res) => {
  try {
    const techniciens = await User.findAll({
      where: { role: "technicien" },
      attributes: ["id", "nom", "email"],
    });
    res.json(techniciens);
  } catch (error) {
    console.error("Erreur lors de la récupération des techniciens :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
