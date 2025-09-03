require("dotenv").config();
const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("❌ DATABASE_URL non définie !");
}

// Connexion PostgreSQL avec SSL (nécessaire sur Render)
const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Ignore certificat auto-signé
    },
  },
  logging: false, // mettre true pour voir les requêtes SQL
});

module.exports = sequelize;
