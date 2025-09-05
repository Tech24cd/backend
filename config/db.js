require("dotenv").config();
const { Sequelize } = require("sequelize");

// Utiliser DATABASE_URL si disponible (Render fournit souvent l'URL complète)
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // nécessaire pour Render
    },
  },
});

module.exports = sequelize;
