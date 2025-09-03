const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const Mission = sequelize.define("Mission", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: DataTypes.TEXT,
    city: DataTypes.STRING,
    address: DataTypes.STRING,
    setupDateTime: DataTypes.DATE,
    teardownDateTime: DataTypes.DATE,
    contactName: DataTypes.STRING,
    contactPhone: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM(
        "non débuté",
        "validé",
        "refusé",
        "montage",
        "démontage",
        "terminé"
      ),
      defaultValue: "non débuté",
    },
    intervenant1Id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    intervenant2Id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    transporteur: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    prestataireId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  });

  Mission.associate = (models) => {
    Mission.belongsTo(models.User, {
      as: "prestataire",
      foreignKey: "prestataireId",
    });
    Mission.belongsTo(models.User, {
      as: "intervenant1",
      foreignKey: "intervenant1Id",
    });
    Mission.belongsTo(models.User, {
      as: "intervenant2",
      foreignKey: "intervenant2Id",
    });
  };

  return Mission; // Pas d'associations ici
};
