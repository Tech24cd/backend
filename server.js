// Charger les variables d'environnement
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const archiver = require("archiver");

const { Sequelize } = require("sequelize");

// Connexion à la BDD avec SSL (Render / PostgreSQL)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Permet de se connecter sans certificat
    },
  },
});

const db = require("./models"); // tes modèles Sequelize
db.sequelize = sequelize;

// Initialiser Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Adapter au besoin
    credentials: true,
  })
);

// Middleware JSON + cookies
app.use(express.json());
app.use(cookieParser());

// Connexion à la BDD et synchronisation
db.sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connecté à la base de données");
    return db.sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("🛠️ Base de données synchronisée");
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

// Routes
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const missionRoutes = require("./routes/mission.routes");
app.use("/api/missions", missionRoutes);

const notificationRoutes = require("./routes/notification.routes");
app.use("/api/notifications", notificationRoutes);

// Route pour télécharger tous les fichiers en ZIP
app.get("/api/missions/:missionId/download-zip", async (req, res) => {
  const { missionId } = req.params;

  try {
    const { PieceJointe } = require("./models"); // tes modèles
    const files = await PieceJointe.findAll({ where: { missionId } });

    if (!files.length) {
      return res
        .status(404)
        .json({ message: "Aucun fichier à télécharger pour cette mission." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=mission_${missionId}_fichiers.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

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
