const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/mission.controller");
const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Routes accessibles aux techniciens et admin

router.get(
  "/",
  auth(["technicien", "admin", "prestataire"]),
  ctrl.getAllMissions
);
router.get("/admin", auth(["admin"]), ctrl.getAllMissionsAdmin);

router.post(
  "/",
  auth(["technicien", "admin", "prestataire"]),
  upload.array("files", 3), // jusqu'à 3 fichiers max sous la clé 'files'
  ctrl.createMission
);

router.get(
  "/prestataire",
  auth(["prestataire"]),
  ctrl.getAllMissionsPrestataire // À créer dans mission.controller.js
);
router.put(
  "/:id",
  auth(["technicien", "admin", "prestataire"]),
  upload.array("files"), // adapter le nom du champ dans le formulaire
  ctrl.updateMission
);
router.patch(
  "/:id/status",
  auth(["technicien", "admin", "prestataire"]),
  ctrl.updateStatus
);

router.post(
  "/:missionId/comments",
  auth(["technicien", "admin", "prestataire"]),
  ctrl.addComment
);
router.delete(
  "/:missionId/comments/:commentId",
  auth(["technicien", "admin", "prestataire"]),
  ctrl.deleteComment
);

// Upload de fichiers (multiple ou single): on garde uniquement la route "multiple"
// Multer gère aussi bien un fichier unique envoyé via 'files' que plusieurs fichiers
router.post(
  "/:missionId/documents",
  auth(["technicien", "admin", "prestataire"]),
  upload.array("files"), // Le champ d’envoi dans le formulaire doit être "files"
  ctrl.addDocument // adapte ta fonction pour gérer un tableau req.files
);

router.delete(
  "/:missionId/documents/:docId",
  auth(["technicien", "admin", "prestataire"]),
  ctrl.deleteDocument
);

router.get(
  "/:missionId/documents",
  auth(["technicien", "admin", "prestataire"]),
  async (req, res) => {
    const { missionId } = req.params;
    try {
      const docs = await require("../models").PieceJointe.findAll({
        where: { missionId },
      });
      res.json(docs); // docs doit contenir { id, filename, etc. }
    } catch (err) {
      console.error("Erreur pour lister documents :", err);
      res
        .status(500)
        .json({ error: "Erreur lors de la récupération des documents" });
    }
  }
);

// Route pour télécharger un fichier spécifique d'une mission
router.get(
  "/:missionId/documents/:docId",
  auth(["technicien", "admin", "prestataire"]),
  async (req, res) => {
    const { docId } = req.params;
    try {
      const { PieceJointe } = require("../models");
      const doc = await PieceJointe.findByPk(docId);
      if (!doc) return res.status(404).json({ error: "Fichier non trouvé" });
      const path = require("path");
      const filePath = path.join(__dirname, "../uploads", doc.filename); // Vérifie le bon chemin
      res.download(filePath, doc.filename);
    } catch (err) {
      console.error("Erreur pour télécharger : ", err);
      res.status(500).json({ error: "Erreur lors du téléchargement" });
    }
  }
);

module.exports = router;
