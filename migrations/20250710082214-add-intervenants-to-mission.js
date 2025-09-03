"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Missions", "intervenant1Id", {
      type: Sequelize.UUID,
      references: {
        model: "Users",
        key: "id",
      },
      allowNull: true,
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
    await queryInterface.addColumn("Missions", "intervenant2Id", {
      type: Sequelize.UUID,
      references: {
        model: "Users",
        key: "id",
      },
      allowNull: true,
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Missions", "intervenant1Id");
    await queryInterface.removeColumn("Missions", "intervenant2Id");
  },
};
