// Charger les variables d'environnement
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const archiver = require("archiver");

const app = express();

// PORT dynamique pour Render
const PORT = process.env.PORT || 3000;

// Middleware CORS avec l'URL du frontend depuis l'env
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Middleware pour parser JSON et cookies
app.use(express.json());
app.use(cookieParser());

// Import du module de la BDD
const db = require("./models");

// Connexion à la BDD
db.sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connecté à la base de données");
    // Synchronisation
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("🛠️ Base de données synchronisée");
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur lors de la connexion ou synchronisation :", err);
  });

// Route de santé
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Routes d'authentification
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Routes utilisateur
const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

// Routes missions
const missionRoutes = require("./routes/mission.routes");
app.use("/api/missions", missionRoutes);

// Routes notifications
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes);

// Route pour télécharger tous les fichiers en ZIP
app.get("/api/missions/:missionId/download-zip", async (req, res) => {
  const { missionId } = req.params;

  try {
    const { PieceJointe } = require("./models"); 
    const files = await PieceJointe.findAll({ where: { missionId } });

    if (!files.length) {
      return res
        .status(404)
        .json({ message: "Aucun fichier à télécharger pour cette mission." });
    }

    // Préparer les headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=mission_${missionId}_fichiers.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    // Ajouter chaque fichier au ZIP
    files.forEach((file) => {
      const filePath = path.join(__dirname, "uploads", file.filename);
      archive.file(filePath, { name: file.filename });
    });

    await archive.finalize();
  } catch (err) {
    console.error("Erreur lors de la création du ZIP : ", err);
    res.status(500).json({ message: "Erreur lors du téléchargement" });
  }
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint non trouvé" });
});
