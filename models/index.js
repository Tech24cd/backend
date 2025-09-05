const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

// Importation des modèles
const Mission = require("./mission.model")(sequelize, DataTypes);
const Comment = require("./comment.model")(sequelize, DataTypes);
const Document = require("./document.model")(sequelize, DataTypes);
const Affectation = require("./affectation.model")(sequelize, DataTypes);
const User = require("./user.model")(sequelize, DataTypes);
const PieceJointe = require("./pieceJointe.model")(sequelize, DataTypes);

// Définition des associations

// Missions
Mission.hasMany(Comment, { onDelete: "CASCADE" });
Comment.belongsTo(Mission);

Mission.hasMany(Document, {
  foreignKey: "missionId",
  as: "Documents", // ici l'alias pour l'inclusion
});
Document.belongsTo(Mission, { foreignKey: "missionId", as: "Mission" });

Mission.hasMany(Affectation, { onDelete: "CASCADE" });
Affectation.belongsTo(Mission);

// Utilisateurs & commentaires & documents
User.hasMany(Comment, { onDelete: "CASCADE" });
Comment.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Document, { onDelete: "CASCADE" });
Document.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Affectation, { onDelete: "CASCADE" });
Affectation.belongsTo(User, { foreignKey: "userId" });

// Relations spécifiques pour Missions et Utilisateurs
Mission.belongsTo(User, {
  as: "intervenant1",
  foreignKey: "intervenant1Id",
});
Mission.belongsTo(User, {
  as: "intervenant2",
  foreignKey: "intervenant2Id",
});
User.hasMany(Mission, {
  as: "missions1",
  foreignKey: "intervenant1Id",
});
User.hasMany(Mission, {
  as: "missions2",
  foreignKey: "intervenant2Id",
});
Mission.belongsTo(User, {
  as: "prestataire",
  foreignKey: "prestataireId",
});
User.hasMany(Mission, {
  as: "missions_prestataire",
  foreignKey: "prestataireId",
});

// Exportation des modèles
module.exports = {
  sequelize,
  Mission,
  Comment,
  Document,
  Affectation,
  User,
  PieceJointe,
};
