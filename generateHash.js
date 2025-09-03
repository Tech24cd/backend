// generate-hash.js
const bcrypt = require("bcryptjs");

const motDePasse = "admin123";

bcrypt.hash(motDePasse, 10).then((hash) => {
  console.log("🔐 Nouveau hash pour admin123 :", hash);
});
