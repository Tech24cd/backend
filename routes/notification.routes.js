const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// Configure ton transporteur SMTP (ici Gmail, avec mot de passe d'application)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // ex: 'tonadresse@gmail.com'
    pass: process.env.MAIL_PASS, // mot de passe d'application Gmail
  },
});

// POST /send-mission : envoie un email pour notifier une nouvelle mission
router.post("/send-mission", async (req, res) => {
  try {
    const {
      missionId,
      emails,
      missionTitle,
      missionDescription,
      missionStartDate,
      missionEndDate,
      missionUrl, // optionnel : lien vers planning, portail, etc.
    } = req.body;

    // Validation rapide
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).send("Pas d'emails fournis ou format incorrect");
    }
    if (!missionId || !missionTitle) {
      return res
        .status(400)
        .send("missionId et missionTitle sont obligatoires");
    }

    // Préparer le contenu de l'email
    const message = {
      from: process.env.MAIL_USER,
      to: emails.join(","),
      subject: `Nouvelle mission assignée : ${missionTitle}`,
      text: `Bonjour,

Vous avez une nouvelle mission assignée.

ID : ${missionId}
Titre : ${missionTitle}
Description : ${missionDescription || "Pas de description fournie."}
Date début : ${missionStartDate || "Non précisée"}
Date fin : ${missionEndDate || "Non précisée"}

${missionUrl ? `Consultez votre planning ici : ${missionUrl}` : ""}

Merci de consulter votre planning pour plus de détails.

Bonne journée !`,
      html: `
        <p>Bonjour,</p>
        <p>Vous avez une nouvelle mission assignée.</p>

        <ul>
          <li><strong>ID :</strong> ${missionId}</li>
          <li><strong>Titre :</strong> ${missionTitle}</li>
          <li><strong>Description :</strong> ${
            missionDescription || "Pas de description fournie."
          }</li>
          <li><strong>Date début :</strong> ${
            missionStartDate || "Non précisée"
          }</li>
          <li><strong>Date fin :</strong> ${
            missionEndDate || "Non précisée"
          }</li>
        </ul>

        ${
          missionUrl
            ? `<p>Consultez votre <a href="${missionUrl}">planning de mission</a>.</p>`
            : ""
        }

        <p>Merci de consulter votre planning pour plus de détails.</p>
        <p>Bonne journée !</p>
      `,
    };

    // Envoi de l'email
    await transporter.sendMail(message);

    res.status(200).send("Emails envoyés avec succès !");
  } catch (error) {
    console.error("Erreur envoi mail : ", error);
    res.status(500).send("Erreur serveur lors de l'envoi d'email");
  }
});

module.exports = router;
