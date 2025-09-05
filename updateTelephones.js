const { User } = require("./models");

async function updateTelephones() {
  const users = await User.findAll();

  for (const user of users) {
    // Exemple : numéro de téléphone fictif
    await user.update({ telephone: "0612345678" });
  }

  console.log("Téléphones mis à jour pour tous les utilisateurs");
}

updateTelephones()
  .catch(console.error)
  .finally(() => process.exit());
