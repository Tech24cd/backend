const fs = require("fs");
const path = require("path");
const { Mission, Comment, Document, Affectation, User } = require("../models");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");

// ------------------------------
// Récupérer les missions pour l'utilisateur connecté (prestataire, admin, etc.)
exports.getAllMissions = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role; // Vérifie que ce champ est bien dans le token
  const status = req.query.status;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // Préparer la clause WHERE selon le rôle
    const whereClause = {
      ...(status && { status }),
    };

    // Récupérer selon le rôle
    if (userRole === "prestataire") {
      // Prestataire ne voit que ses missions
      whereClause.prestataireId = userId;
    } else if (userRole === "technicien") {
      // Un technicien ne voit que les missions où il est intervenant1 ou intervenant2
      whereClause[Op.or] = [
        { intervenant1Id: userId },
        { intervenant2Id: userId },
      ];
    } else if (userRole === "admin") {
      // Admin voit tout (pas de filtre supplémentaire)
    } else {
      // Rôle non autorisé pour cette lecture
      return res.status(403).json({ message: "Accès refusé." });
    }

    const missions = await Mission.findAll({
      where: whereClause,
      include: [
        { model: User, as: "prestataire", attributes: ["id", "nom", "email"] },
        { model: Comment },
        { model: Document, as: "Documents" },
        {
          model: User,
          as: "intervenant1",
          attributes: ["id", "nom", "email", "telephone"],
        },
        {
          model: User,
          as: "intervenant2",
          attributes: ["id", "nom", "email", "telephone"],
        },
      ],
      order: [["setupDateTime", "ASC"]],
      limit,
      offset,
    });

    res.json(missions);
  } catch (error) {
    console.error("Erreur récupération missions :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer toutes les missions pour l'admin (sans restriction)
// mission.controller.js
exports.getAllMissionsAdmin = async (req, res) => {
  try {
    const missions = await Mission.findAll({
      include: [
        { model: User, as: "prestataire", attributes: ["id", "nom", "email"] },
        { model: Comment },
        { model: Document, as: "Documents" },
        { model: Affectation },
        {
          model: User,
          as: "intervenant1",
          attributes: ["id", "nom", "email"],
        },
        {
          model: User,
          as: "intervenant2",
          attributes: ["id", "nom", "email"],
        },
      ],
    });
    res.json(missions);
  } catch (error) {
    console.error("Erreur récupération missions (admin) : ", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
// Récupérer toutes les missions pour le prestataire connecté
exports.getAllMissionsPrestataire = async (req, res) => {
  try {
    console.log("Données utilisateur du token : ", req.user);
    if (req.user.role !== "prestataire") {
      return res.status(403).json({ message: "Accès non autorisé" });
    }

    const prestataireId = req.user.id;
    console.log("Filtre par prestataireId :", prestataireId);
    // Vérifie dans la DB si cet ID correspond à certaines missions
    const missions = await Mission.findAll({
      where: { prestataireId },
      include: [
        { model: Comment },
        { model: Document, as: "Documents" },
        { model: Affectation, required: false },
        {
          model: User,
          as: "intervenant1",
          attributes: ["id", "nom", "email", "telephone"],
        },
        {
          model: User,
          as: "intervenant2",
          attributes: ["id", "nom", "email", "telephone"],
        },
      ],
      order: [["setupDateTime", "ASC"]],
    });
    console.log("Nombre de missions trouvées :", missions.length);
    res.json(missions);
  } catch (err) {
    console.error("Erreur dans getAllMissionsPrestataire : ", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ------------------------------
// Création d'une mission
exports.createMission = async (req, res) => {
  try {
    const {
      title,
      description,
      city,
      address,
      setupDateTime,
      teardownDateTime,
      contactName,
      contactPhone,
      status,
      intervenant1Id,
      intervenant2Id,
      transporteur,
    } = req.body;

    if (!title || !setupDateTime || !contactName) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    // Récupérer le prestataireId depuis le corps (si fourni par frontend)
    // et le définir selon le rôle de l'utilisateur
    let prestataireId; // cette déclaration est désormais unique

    if (userRole === "prestataire") {
      prestataireId = userId; // L'utilisateur connecté est le prestataire
    } else if (userRole === "admin") {
      // Lors de la création, on récupère la valeur envoyée par le frontend
      prestataireId = req.body.prestataireId || null;
    } else {
      prestataireId = null; // autres rôles
    }

    const mission = await Mission.create({
      title,
      description,
      city,
      address,
      setupDateTime,
      teardownDateTime,
      contactName,
      contactPhone,
      status,
      intervenant1Id,
      intervenant2Id,
      transporteur,
      prestataireId,
    });

    // Gestion fichiers uploadés
    const files = req.files;
    if (files && files.length > 0) {
      for (const file of files) {
        await Document.create({
          missionId: mission.id,
          filename: file.originalname,
          path: file.path,
        });
      }
    }

    const missionComplete = await Mission.findByPk(mission.id, {
      include: [
        { model: User, as: "prestataire", attributes: ["id", "nom", "email"] },
        { model: Document, as: "Documents" },
        { model: Comment },
        {
          model: User,
          as: "intervenant1",
          attributes: ["id", "nom", "email", "telephone"],
        },
        {
          model: User,
          as: "intervenant2",
          attributes: ["id", "nom", "email", "telephone"],
        },
      ],
    });

    res.status(201).json(missionComplete);
  } catch (error) {
    console.error("Erreur création mission : ", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ------------------------------
// Mise à jour d'une mission
exports.updateMission = async (req, res) => {
  try {
    const mission = await Mission.findByPk(req.params.id);
    if (!mission) return res.sendStatus(404);

    const {
      title,
      description,
      city,
      address,
      setupDateTime,
      teardownDateTime,
      contactName,
      contactPhone,
      status,
      intervenant1Id,
      intervenant2Id,
      transporteur,
      prestataireId, // possibilité de changer le prestataire
    } = req.body;

    // MàJ des champs si présents
    if (title !== undefined) mission.title = title;
    if (description !== undefined) mission.description = description;
    if (city !== undefined) mission.city = city;
    if (address !== undefined) mission.address = address;
    if (setupDateTime !== undefined) mission.setupDateTime = setupDateTime;
    if (teardownDateTime !== undefined)
      mission.teardownDateTime = teardownDateTime;
    if (contactName !== undefined) mission.contactName = contactName;
    if (contactPhone !== undefined) mission.contactPhone = contactPhone;
    if (status !== undefined) mission.status = status;
    if (intervenant1Id !== undefined) mission.intervenant1Id = intervenant1Id;
    if (intervenant2Id !== undefined) mission.intervenant2Id = intervenant2Id;
    if (transporteur !== undefined) mission.transporteur = transporteur;
    if (prestataireId !== undefined) mission.prestataireId = prestataireId;

    await mission.save();

    // Gestion fichiers uploadés
    const files = req.files;
    if (files && files.length > 0) {
      for (const file of files) {
        await Document.create({
          missionId: mission.id,
          filename: file.originalname,
          path: file.path,
        });
      }
    }

    const missionComplete = await Mission.findByPk(mission.id, {
      include: [
        { model: Document, as: "Documents" },
        { model: Comment },
        {
          model: User,
          as: "intervenant1",
          attributes: ["id", "nom", "email", "telephone"],
        },
        {
          model: User,
          as: "intervenant2",
          attributes: ["id", "nom", "email", "telephone"],
        },
      ],
    });

    res.json(missionComplete);
  } catch (error) {
    console.error("Erreur mise à jour mission :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mise à jour du statut

exports.updateStatus = async (req, res) => {
  try {
    const mission = await Mission.findByPk(req.params.id, {
      include: [
        { model: User, as: "intervenant1" },
        { model: User, as: "intervenant2" },
        { model: User, as: "prestataire" },
      ],
    });
    if (!mission) return res.sendStatus(404);

    const oldStatus = mission.status;
    mission.status = req.body.status;
    await mission.save();

    // Préparer l'email
    const now = new Date().toLocaleString();
    const user = req.user; // { id, role } dans le token
    const destinataires = [
      mission.intervenant1?.email,
      mission.intervenant2?.email,
      mission.prestataire?.email,
    ].filter(Boolean);

    // Configure ton transporteur (idéalement à factoriser ailleurs)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: destinataires.join(","),
      subject: `Mise à jour du statut de la mission "${mission.title}"`,
      text: `Bonjour,

La mission "${mission.title}" a été mise à jour. Voici tous les détails :

--- Détails de la mission ---
Titre : ${mission.title}
Description : ${mission.description}
Adresse : ${mission.address}
Ville : ${mission.city}
Contact : ${mission.contactName} (${mission.contactPhone})
Intervenant 1 : ${
        mission.intervenant1
          ? `${mission.intervenant1.nom} (${mission.intervenant1.email})`
          : "-"
      }
Intervenant 2 : ${
        mission.intervenant2
          ? `${mission.intervenant2.nom} (${mission.intervenant2.email})`
          : "-"
      }
Transporteur : ${mission.transporteur || "-"}
Montage : ${new Date(mission.setupDateTime).toLocaleString()}
Démontage : ${new Date(mission.teardownDateTime).toLocaleString()}

--- Statuts ---
Ancien statut : ${oldStatus}
Nouveau statut : ${mission.status}

--- Informations de modification ---
Date/heure : ${now}
Modifié par : ${user.role} (ID: ${user.id})

Pour plus de détails, veuillez consulter la plateforme.

Cordialement,`,
    };

    // Envoi de l'email (non bloquant pour la réponse API)
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Erreur envoi mail statut mission :", err);
      } else {
        console.log("Mail statut mission envoyé :", info.response);
      }
    });

    res.json(mission);
  } catch (error) {
    console.error("Erreur mise à jour status :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Ajouter un commentaire
exports.addComment = async (req, res) => {
  const { missionId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Contenu du commentaire requis" });
  }

  try {
    const comment = await Comment.create({
      content,
      author: req.user.name,
      date: new Date(),
      MissionId: missionId,
    });
    res.status(201).json(comment);
  } catch (error) {
    console.error("Erreur ajout commentaire :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer un commentaire
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.commentId);
    if (!comment) return res.sendStatus(404);
    if (comment.author !== req.user.name) return res.sendStatus(403);

    await comment.destroy();
    res.sendStatus(204);
  } catch (error) {
    console.error("Erreur suppression commentaire :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Ajouter un document (upload fichier)
exports.addDocument = async (req, res) => {
  const { missionId } = req.params;
  const files = req.files || (req.file ? [req.file] : []);

  if (!files || files.length === 0) {
    return res.status(400).json({ message: "Aucun fichier envoyé" });
  }

  try {
    const createdDocs = [];

    for (const file of files) {
      const document = await Document.create({
        filename: file.originalname,
        path: file.path,
        missionId,
      });
      createdDocs.push(document);
    }

    res
      .status(201)
      .json(createdDocs.length === 1 ? createdDocs[0] : createdDocs);
  } catch (error) {
    console.error("Erreur ajout document(s) :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer un document
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.docId);
    if (!doc) return res.sendStatus(404);

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      path.basename(doc.path || doc.url)
    );

    fs.unlink(filePath, async (err) => {
      if (err) console.warn("Erreur suppression fichier :", err.message);
      await doc.destroy();
      res.sendStatus(204);
    });
  } catch (error) {
    console.error("Erreur suppression document :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
