const jwt = require("jsonwebtoken");

const auth = (roles = []) => {
  return (req, res, next) => {
    const tokenFromCookies = req.cookies?.token;
    const authHeader = req.headers.authorization;
    let token;

    // Récupérer le token (cookie ou en-tête)
    if (tokenFromCookies) {
      token = tokenFromCookies;
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Vérifier si le token est présent
    if (!token) {
      return res.status(401).json({ message: "Token manquant." });
    }

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Ajoute les infos utilisateur dans la requête

      // Vérification des rôles si délimités
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Accès refusé." });
      }

      next(); // Passe au middleware suivant
    } catch (err) {
      return res.status(401).json({ message: "Token invalide." });
    }
  };
};

module.exports = auth;
