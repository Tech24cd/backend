module.exports = (sequelize, DataTypes) => {
  return sequelize.define("PieceJointe", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nom_fichier: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type_fichier: {
      type: DataTypes.STRING,
    },
  });
};
