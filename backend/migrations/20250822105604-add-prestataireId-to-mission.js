"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Missions", "prestataireId", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "Users", // Vérifie le nom exact du modèle/table
        key: "id",
      },
      onUpdate: "CASCADE", // si l'ID utilisateur change, la mise à jour est propagée
      onDelete: "SET NULL", // si l'utilisateur est supprimé, la
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Missions", "prestataireId");
  },
};
