const bcrypt = require("bcryptjs");

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log("Hash bcrypt généré :", hash);
}

generateHash("admin123"); // Remplace "admin123" par ton mot de passe voulu
