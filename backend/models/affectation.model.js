module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Affectation", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    technicien: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
