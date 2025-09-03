module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define(
    "Document",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      missionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mimetype: {
        type: DataTypes.STRING(100),
      },
      size: {
        type: DataTypes.INTEGER,
      },
      uploadDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      getterMethods: {
        url() {
          return `http://localhost:3000${this.path}`; // adapte à ton API
        },
        name() {
          return this.filename; // ou autre propriété si tu veux
        },
      },
    }
  );

  return Document;
};
