// ╔══════════════════════════════════════════════════════════════╗
//  CONFIGURATION — Remplissez tous les champs avant de lancer
// ╚══════════════════════════════════════════════════════════════╝

const CONFIG = {
  DOC_NOTES_ID:        "",
  DOSSIER_RAPPORTS_ID: "",
  GROQ_API_KEY:        "",
  GITHUB_TOKEN: "",
  GITHUB_USERNAME: "",
  GITHUB_REPOS: [
    "Clarco-Mada-digital/Projet_Salon"
],
// Heure de récupération des commits (chaque soir)
  HEURE_COMMITS: 16,
  MINUTE_COMMITS: 0,   

  NOM_PRENOM:          "TINOGNY Yonni",
  NOM_PROJET:          "Salon Atlas, Maquette Gplus et Gplus Hotel, Lexxy",
  DESTINATAIRES:       "assist-direction@mada-digital.net",
  CC:                  "direction@mada-digital.net",
  SUJET_FIL:           "Rapport de stage",
  HEURE_DECLENCHEMENT: 16,
  MINUTE_DECLENCHEMENT: 30,

  // ✅ NOUVEAU — Contexte et rôle du stagiaire sur chaque projet
  PROJETS_CONTEXTE: [
    {
      nom: "Salon Atlas",
      role: "Développeur principal (backend)",
      description: "Application de gestion de salon de coiffure (réservations, accès multi-rôles, etc.)"
    },
    {
      nom: "Lexxy",
      role: "Testeur / correcteur de contenu uniquement (QA)",
      description: "Je ne développe pas sur ce projet. Mon rôle se limite aux tests fonctionnels et aux corrections mineures de contenu (ex : glossaire)."
    },
    {
      nom: "Maquette Gplus et Gplus Hotel",
      role: "Designer UI/UX",
      description: "Faire une refonte UI/UX de Gplus et Gplus Hotel"
    }
  ],
};

 
// ╔══════════════════════════════════════════════════════════════╗
//  GITHUB — Récupération des commits
// ╚══════════════════════════════════════════════════════════════╝
 
/**
 * Récupère les commits du jour sur tous les dépôts configurés
 * et les ajoute dans le doc de notes.
 * Cette fonction est appelée automatiquement chaque soir.
 */
function recupererEtAjouterCommits() {
  Logger.log("══════════════════════════════════════");
  Logger.log("▶ Récupération des commits — " + formaterDateFR(new Date()));
  Logger.log("══════════════════════════════════════");
 
  try {
    const aujourd_hui = new Date();
    const debutJournee = new Date(aujourd_hui);
    debutJournee.setHours(0, 0, 0, 0);
 
    const commitsTousDepots = [];
 
    CONFIG.GITHUB_REPOS.forEach(function (repo) {
      Logger.log("🔍 Vérification du dépôt : " + repo);
      const commits = recupererCommitsDepot(repo, debutJournee, aujourd_hui);
      if (commits.length > 0) {
        commitsTousDepots.push({ repo: repo, commits: commits });
        Logger.log("   → " + commits.length + " commit(s) trouvé(s)");
      } else {
        Logger.log("   → Aucun commit aujourd'hui");
      }
    });
 
    if (commitsTousDepots.length === 0) {
      Logger.log("ℹ️ Aucun commit aujourd'hui — doc de notes inchangé.");
      return;
    }
 
    // Ajoute les commits dans le doc de notes
    ajouterCommitsDansNotes(commitsTousDepots, aujourd_hui);
    Logger.log("✅ Commits ajoutés dans le doc de notes !");
 
  } catch (e) {
    Logger.log("❌ ERREUR récupération commits : " + e.message);
  }
}
 
/**
 * Appelle l'API GitHub pour récupérer les commits d'un dépôt
 * entre deux dates.
 */
function recupererCommitsDepot(repo, depuis, jusqua) {
  // ✅ repo contient déjà "proprietaire/nom", on ne préfixe pas avec USERNAME
  const url = "https://api.github.com/repos/" + repo +
    "/commits?author=" + CONFIG.GITHUB_USERNAME +
    "&since=" + depuis.toISOString() +
    "&until=" + jusqua.toISOString() +
    "&per_page=50";
  Logger.log("URL : " + url)
  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      "Authorization": "Bearer " + CONFIG.GITHUB_TOKEN,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();

  if (code === 404) {
    Logger.log("   ⚠️ Dépôt introuvable : " + repo);
    return [];
  }
  if (code === 401) {
    throw new Error("Token GitHub invalide ou expiré.");
  }
  if (code !== 200) {
    Logger.log("   ⚠️ Erreur API GitHub (" + code + ") pour " + repo);
    return [];
  }

  const data = JSON.parse(response.getContentText());
  return data.map(function (commit) {
    return {
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.trim(),
      date: new Date(commit.commit.author.date),
    };
  });
}
 
/**
 * Ajoute les commits récupérés dans le doc de notes,
 * sous une section "Commits GitHub — [date]".
 */
function ajouterCommitsDansNotes(commitsTousDepots, date) {
  const doc = DocumentApp.openById(CONFIG.DOC_NOTES_ID);
  const body = doc.getBody();
  const dateStr = formaterDateFR(date);
 
  // Vérifie si une section commits existe déjà pour aujourd'hui
  const texteExistant = body.getText();
  const marqueur = "🔧 Commits GitHub — " + dateStr;
 
  if (texteExistant.includes(marqueur)) {
    Logger.log("ℹ️ Section commits du " + dateStr + " déjà présente — mise à jour ignorée.");
    return;
  }
 
  // Cherche la section "🔧 Commits GitHub" pour regrouper
  // Sinon ajoute à la fin du document
  body.appendParagraph("");
 
  const titreSection = body.appendParagraph(marqueur);
  titreSection.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  titreSection.editAsText()
    .setFontFamily("Arial")
    .setFontSize(12)
    .setBold(true)
    .setForegroundColor("#333333");
 
  commitsTousDepots.forEach(function (depot) {
    // Titre du dépôt
    const titreDepot = body.appendParagraph("📁 " + depot.repo);
    titreDepot.editAsText()
      .setFontFamily("Arial")
      .setFontSize(11)
      .setBold(true)
      .setForegroundColor("#1a73e8");
    titreDepot.setIndentStart(20);
 
    // Liste des commits
    depot.commits.forEach(function (commit) {
      const heure = Utilities.formatDate(commit.date, Session.getScriptTimeZone(), "HH:mm");
  const lignes = commit.message.split("\n").filter(function(l) { return l.trim() !== ""; });
  const premiereLigne = lignes[0];
  const corps = lignes.slice(1).join(" ").trim(); // le reste du message

  // Ligne principale — bullet
  const li = body.appendListItem("[" + commit.sha + "] " + premiereLigne + "  (" + heure + ")");
  li.setGlyphType(DocumentApp.GlyphType.BULLET);
  li.editAsText().setFontFamily("Arial").setFontSize(11).setBold(false).setForegroundColor("#333333");
  li.setIndentStart(56); li.setIndentFirstLine(36);

  // Corps du message — texte indenté en dessous (si présent)
  if (corps) {
    const detail = body.appendParagraph(corps);
    detail.editAsText()
      .setFontFamily("Arial")
      .setFontSize(10)
      .setItalic(true)
      .setForegroundColor("#777777");
    detail.setIndentStart(72);
  }
    });
  });
 
  doc.saveAndClose();
}

/**
 * Récupère et ajoute dans le doc de notes les commits d'une date précise.
 * Modifiez simplement DATE_CIBLE avant de lancer.
 * Format : "YYYY-MM-DD"
 */
function recupererCommitsPourDate() {
  const DATE_CIBLE = "2026-04-17";

  const depuis = new Date(DATE_CIBLE + "T00:00:00.000Z");
  const jusqua  = new Date(DATE_CIBLE + "T23:59:59.000Z");
  const dateObj = new Date(DATE_CIBLE + "T12:00:00.000Z"); // pour formaterDateFR

  Logger.log("══════════════════════════════════════");
  Logger.log("▶ Récupération des commits — " + formaterDateFR(dateObj));
  Logger.log("══════════════════════════════════════");

  const commitsTousDepots = [];

  CONFIG.GITHUB_REPOS.forEach(function (repo) {
    Logger.log("🔍 Dépôt : " + repo);
    const commits = recupererCommitsDepot(repo, depuis, jusqua);
    if (commits.length > 0) {
      commitsTousDepots.push({ repo: repo, commits: commits });
      Logger.log("   → " + commits.length + " commit(s) trouvé(s)");
      commits.forEach(function (c) {
        Logger.log("     [" + c.sha + "] " + c.message.split("\n")[0]);
      });
    } else {
      Logger.log("   → Aucun commit ce jour-là");
    }
  });

  if (commitsTousDepots.length === 0) {
    Logger.log("ℹ️ Aucun commit trouvé pour le " + formaterDateFR(dateObj));
    return;
  }

  ajouterCommitsDansNotes(commitsTousDepots, dateObj);
  Logger.log("✅ Commits du " + formaterDateFR(dateObj) + " ajoutés dans le doc de notes !");
}

// ╔══════════════════════════════════════════════════════════════╗
//  FONCTION PRINCIPALE
// ╚══════════════════════════════════════════════════════════════╝

function genererRapportsHebdomadaires() {
  Logger.log("══════════════════════════════════════");
  Logger.log("▶ Démarrage — " + new Date().toLocaleString());
  Logger.log("══════════════════════════════════════");

  try {
    const notesDoc = DocumentApp.openById(CONFIG.DOC_NOTES_ID);
    const notesBrutes = notesDoc.getBody().getText().trim();
    if (!notesBrutes || notesBrutes.length < 30) {
      throw new Error("Le document de notes semble vide. Avez-vous bien renseigné vos notes ?");
    }
    Logger.log("✅ Notes lues (" + notesBrutes.length + " caractères)");

    Logger.log("⏳ Appel Groq AI...");
    const rapports = genererDeuxVersionsAvecGroq(notesBrutes);
    Logger.log("✅ Contenu généré");

    const nomFichier = creerNomFichier();
    const docRapport = creerDocRapportLong(rapports.long, nomFichier);
    Logger.log("✅ Rapport long créé → " + docRapport.getUrl());

    creerBrouillonReponse(rapports.court, docRapport.getUrl());
    Logger.log("✅ Brouillon de réponse créé dans le fil");

    archiverNotes(notesDoc, nomFichier);
    Logger.log("✅ Notes archivées et doc remis à zéro");

    Logger.log("══════════════════════════════════════");
    Logger.log("🎉 TERMINÉ avec succès !");
    Logger.log("══════════════════════════════════════");

  } catch (e) {
    Logger.log("❌ ERREUR : " + e.message);
    GmailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      "⚠️ [Rapport hebdo] Erreur dans le script",
      "Une erreur est survenue :\n\n" + e.message + "\n\nVérifiez les logs sur script.google.com"
    );
  }
}

// ╔══════════════════════════════════════════════════════════════╗
//  GROQ — Génère les deux versions en un seul appel
// ╚══════════════════════════════════════════════════════════════╝

function genererDeuxVersionsAvecGroq(notesBrutes) {
  const semaine = getLibelleSemaine();

  // ✅ Construction du contexte projets depuis CONFIG
  const contextesProjets = CONFIG.PROJETS_CONTEXTE.map(function(p) {
    return "- " + p.nom + " : " + p.role + " — " + p.description;
  }).join("\n");

  const prompt =
    "Tu es un assistant qui aide un stagiaire développeur à transformer ses notes brutes en rapports professionnels.\n\n" +

    "CONTEXTE STAGIAIRE :\n" +
    "- Stagiaire : " + CONFIG.NOM_PRENOM + "\n" +
    "- Semaine : " + semaine + "\n\n" +

    // ✅ Injection des rôles par projet
    "RÔLES SUR LES PROJETS (respecte-les STRICTEMENT) :\n" +
    contextesProjets + "\n\n" +

    // ✅ Règles de rédaction renforcées
    "RÈGLES DE RÉDACTION IMPORTANTES :\n" +
"- Chaque tâche mentionnée dans les notes DOIT devenir un item distinct. Ne fusionne JAMAIS deux tâches en une.\n" +
"- Si une URL est mentionnée (ex : sitemap), inclus-la explicitement dans la description de l'item.\n" +
"- Si des types de comptes sont listés (ex : admin, client, gérant...), recopie-les tous dans l'item correspondant.\n" +
"- Si les notes mentionnent 'avec le test qui va avec' ou similaire, ajoute cet élément dans tests_effectues.\n" +
"- La version courte (email) doit aussi refléter ce niveau de détail : chaque point_cle doit être une tâche distincte, pas un regroupement flou.\n" +
"- Si le stagiaire est TESTEUR ou CORRECTEUR sur un projet, n'écris JAMAIS qu'il développe ou implémente. Utilise : tester, vérifier, corriger, signaler.\n" +
"- Si 'Livrables produits' dans les notes est vide ou placeholder, déduis les livrables depuis les tâches réalisées (ex : sitemap déployé = livrable).\n" +
"- Si 'Objectifs semaine prochaine' est vague (ex : 'Continuer les corrections'), garde-le tel quel sans l'inventer.\n" +
"- Ton professionnel, concis, à la première personne du singulier.\n\n" +

    "NOTES BRUTES :\n---\n" + notesBrutes.substring(0, 10000) + "\n---\n\n" +

    "Génère DEUX versions. Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backtick.\n\n" +

    "RÈGLE sur les projets :\n" +
    "- UN seul projet dans les notes → format un projet\n" +
    "- PLUSIEURS projets dans les notes → format plusieurs projets, dissocie-les\n\n" +

    'FORMAT JSON — UN SEUL PROJET :\n' +
    '{\n' +
    '  "long": {\n' +
    '    "objet": "Paragraphe introductif (3-5 phrases), semaine + projet + bilan global.",\n' +
    '    "activites_realisees": [{"categorie": "Nom catégorie", "items": ["Action 1", "Action 2"]}],\n' +
    '    "livrables": ["Livrable 1"],\n' +
    '    "tests_effectues": ["Test 1"],\n' +
    '    "difficultes": ["Point attention 1"],\n' +
    '    "planification": ["Objectif 1"],\n' +
    '    "conclusion": "Paragraphe conclusion (3-4 phrases)."\n' +
    '  },\n' +
    '  "court": {\n' +
    '    "intro": "Voici un résumé des travaux réalisés durant la semaine du ' + semaine + ', consacrée à [résumé 1 ligne].",\n' +
    '    "projets": [{\n' +
    '      "nom": "Nom du projet",\n' +
    '      "points_cles": [{"categorie": "Nom court", "description": "description concise"}],\n' +
    '      "livrables": ["Livrable court 1"],\n' +
    '      "difficultes": ["Difficulté 1"]\n' +
    '    }],\n' +
    '    "objectifs": ["Objectif 1", "Objectif 2"]\n' +
    '  }\n' +
    '}\n\n' +

    'FORMAT JSON — PLUSIEURS PROJETS :\n' +
    '{\n' +
    '  "long": {\n' +
    '    "objet": "Paragraphe introductif mentionnant tous les projets.",\n' +
    '    "activites_realisees": [\n' +
    '      {"categorie": "Projet X — Catégorie", "items": ["Action 1"]},\n' +
    '      {"categorie": "Projet Y — Catégorie", "items": ["Action 1"]}\n' +
    '    ],\n' +
    '    "livrables": ["Livrable X", "Livrable Y"],\n' +
    '    "tests_effectues": ["Test 1"],\n' +
    '    "difficultes": ["Point attention 1"],\n' +
    '    "planification": ["Objectif 1", "Objectif 2"],\n' +
    '    "conclusion": "Paragraphe conclusion mentionnant tous les projets."\n' +
    '  },\n' +
    '  "court": {\n' +
    '    "intro": "Voici un résumé des travaux réalisés durant la semaine du ' + semaine + ', consacrée à [résumé mentionnant les projets].",\n' +
    '    "projets": [\n' +
    '      {"nom": "Projet 1", "points_cles": [{"categorie": "Nom", "description": "desc"}], "livrables": ["L1"], "difficultes": ["D1"]},\n' +
    '      {"nom": "Projet 2", "points_cles": [{"categorie": "Nom", "description": "desc"}], "livrables": ["L1"], "difficultes": ["D1"]}\n' +
    '    ],\n' +
    '    "objectifs": ["Objectif global 1", "Objectif global 2"]\n' +
    '  }\n' +
    '}\n\n' +

    'RAPPELS FINAUX :\n' +
    '- "intro" commence TOUJOURS par "Voici un résumé des travaux réalisés durant la semaine du ' + semaine + ', consacrée à..."\n' +
    '- Pas de tests → tableau vide []\n' +
    '- Pas de difficultés majeures → mettre les points à surveiller\n' +
    '- Réponds UNIQUEMENT avec le JSON, rien d\'autre';

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + CONFIG.GROQ_API_KEY },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const data = JSON.parse(response.getContentText());
  if (data.error) throw new Error("Erreur Groq API : " + data.error.message);

  const texte = data.choices[0].message.content.trim();
  const jsonPropre = texte
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(jsonPropre);
  } catch (e) {
    throw new Error("JSON invalide reçu de Groq : " + texte.substring(0, 300));
  }
}

// ╔══════════════════════════════════════════════════════════════╗
//  GESTION DU FIL EMAIL
// ╚══════════════════════════════════════════════════════════════╝

function recupererFilEmail() {
  const props = PropertiesService.getScriptProperties();
  const threadIdSauvegarde = props.getProperty("RAPPORT_THREAD_ID");

  if (threadIdSauvegarde) {
    try {
      const thread = GmailApp.getThreadById(threadIdSauvegarde);
      if (thread) {
        Logger.log("✅ Fil retrouvé via ID mémorisé : " + threadIdSauvegarde);
        return thread;
      }
    } catch (e) {
      Logger.log("⚠️ ID mémorisé invalide, recherche dans Gmail...");
      props.deleteProperty("RAPPORT_THREAD_ID");
    }
  }

  Logger.log("🔍 Recherche du fil dans Gmail...");
  const threads = GmailApp.search('subject:"' + CONFIG.SUJET_FIL + '"', 0, 5);

  if (!threads || threads.length === 0) {
    throw new Error(
      'Aucun fil trouvé avec l\'objet "' + CONFIG.SUJET_FIL + '".\n' +
      "Vérifiez que CONFIG.SUJET_FIL correspond à une partie de l'objet de votre premier email."
    );
  }

  const thread = threads[0];
  props.setProperty("RAPPORT_THREAD_ID", thread.getId());
  Logger.log("✅ Fil trouvé et mémorisé : " + thread.getId());
  Logger.log("   Objet : " + thread.getFirstMessageSubject());
  return thread;
}

function redefinirFilEmail() {
  const NOUVEL_ID = "COLLEZ_ICI_L_ID_DU_NOUVEAU_FIL";
  PropertiesService.getScriptProperties().setProperty("RAPPORT_THREAD_ID", NOUVEL_ID);
  Logger.log("✅ Nouveau fil mémorisé : " + NOUVEL_ID);
}

function afficherFilMemoise() {
  const id = PropertiesService.getScriptProperties().getProperty("RAPPORT_THREAD_ID");
  Logger.log(id ? "Fil mémorisé : " + id : "Aucun fil mémorisé.");
}

// ╔══════════════════════════════════════════════════════════════╗
//  BROUILLON — Répondre dans le fil (sans se mettre en destinataire)
// ╚══════════════════════════════════════════════════════════════╝

function creerBrouillonReponse(c, lienDrive) {
  const thread = recupererFilEmail();
  const messages = thread.getMessages();
  const myEmail = Session.getActiveUser().getEmail();

  // ✅ FIX : on cherche le dernier message qui ne vient pas de nous
  // pour éviter de se retrouver en destinataire du reply
  let messageRef = messages[messages.length - 1];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messages[i].getFrom().includes(myEmail)) {
      messageRef = messages[i];
      break;
    }
  }
  Logger.log("📧 Message de référence : " + messageRef.getFrom());

  const introHtml =
    "<p>Bonjour,</p>" +
    "<p>" + c.intro + "</p>" +
    '<p>Lien drive pour la version détaillée : <a href="' + lienDrive + '" style="color:#1a73e8;">' + lienDrive + "</a></p>";

  let contenuProjets = "";

  if (c.projets && c.projets.length > 1) {
    c.projets.forEach(function (projet) {
      const difficultesHtml = (projet.difficultes && projet.difficultes.length > 0)
        ? projet.difficultes.map(function (d) { return "<li>" + d + "</li>"; }).join("")
        : "<li>Aucun blocage majeur.</li>";

      contenuProjets +=
        '<p style="margin-top:20px; margin-bottom:4px;"><strong style="font-size:12pt; color:#1a1a2e;">' + projet.nom + "</strong></p>" +
        "<p><strong>Points clés :</strong></p>" +
        "<ul>" + projet.points_cles.map(function (p) { return "<li><strong>" + p.categorie + " :</strong> " + p.description + "</li>"; }).join("") + "</ul>" +
        "<p><strong>Livrables :</strong></p>" +
        "<ul>" + projet.livrables.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" +
        "<p><strong>Difficultés / points en attente :</strong></p>" +
        "<ul>" + difficultesHtml + "</ul>";
    });

    contenuProjets +=
      "<p><strong>Objectifs — semaine suivante :</strong></p>" +
      "<ul>" + c.objectifs.map(function (o) { return "<li>" + o + "</li>"; }).join("") + "</ul>";

  } else {
    const projet = (c.projets && c.projets.length === 1) ? c.projets[0] : null;
    const points_cles = projet ? projet.points_cles : c.points_cles;
    const livrables   = projet ? projet.livrables   : c.livrables;
    const difficultes = projet ? projet.difficultes  : c.difficultes;

    const difficultesHtml = (difficultes && difficultes.length > 0)
      ? difficultes.map(function (d) { return "<li>" + d + "</li>"; }).join("")
      : "<li>Aucun blocage majeur cette semaine.</li>";

    contenuProjets =
      "<p><strong>Points clés :</strong></p>" +
      "<ul>" + points_cles.map(function (p) { return "<li><strong>" + p.categorie + " :</strong> " + p.description + "</li>"; }).join("") + "</ul>" +
      "<p><strong>Livrables :</strong></p>" +
      "<ul>" + livrables.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" +
      "<p><strong>Difficultés / points en attente :</strong></p>" +
      "<ul>" + difficultesHtml + "</ul>" +
      "<p><strong>Objectifs — semaine suivante :</strong></p>" +
      "<ul>" + c.objectifs.map(function (o) { return "<li>" + o + "</li>"; }).join("") + "</ul>";
  }

  const signature =
    '<p style="margin-top:24px;">Cordialement,<br><strong>' + CONFIG.NOM_PRENOM + "</strong></p>";

  const corps =
    '<div style="font-family: Aptos, Arial, sans-serif; font-size: 10pt; color: #333333; max-width: 650px; line-height: 1.7;">' +
    introHtml + contenuProjets + signature +
    "</div>";


const msgId = messageRef.getHeader('Message-ID');
const sujet = "Re: " + thread.getFirstMessageSubject();
GmailApp.createDraft(CONFIG.DESTINATAIRES, sujet, corps, {
  htmlBody: corps,
  cc: CONFIG.CC,
  headers: {
    'In-Reply-To': msgId,
    'References': msgId
  }
});

  Logger.log("✅ Brouillon créé — À : " + CONFIG.DESTINATAIRES + " | CC : " + CONFIG.CC);
}

// ╔══════════════════════════════════════════════════════════════╗
//  RAPPORT LONG — Google Doc (7 sections)
// ╚══════════════════════════════════════════════════════════════╝

function creerDocRapportLong(c, nomFichier) {
  const dossier = DriveApp.getFolderById(CONFIG.DOSSIER_RAPPORTS_ID);
  const doc = DocumentApp.create(nomFichier);
  const body = doc.getBody();

  body.setMarginTop(72); body.setMarginBottom(72);
  body.setMarginLeft(72); body.setMarginRight(72);

  const titre = body.appendParagraph("Rapport — Semaine du " + getLibelleSemaine());
  titre.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  titre.editAsText().setFontFamily("Arial").setFontSize(16).setBold(true).setForegroundColor("#1a1a2e");

  body.appendParagraph("Stagiaire : " + CONFIG.NOM_PRENOM + "    Projet : " + CONFIG.NOM_PROJET)
    .editAsText().setFontFamily("Arial").setFontSize(11).setBold(false).setForegroundColor("#444444");

  body.appendHorizontalRule();
  body.appendParagraph("");

  ajouterH2(body, "1. Objet");
  body.appendParagraph(c.objet)
    .editAsText().setFontFamily("Arial").setFontSize(11).setForegroundColor("#333333");
  body.appendParagraph("");

  ajouterH2(body, "2. Activités réalisées (synthèse)");
  c.activites_realisees.forEach(function (groupe) {
    const cat = body.appendParagraph(groupe.categorie);
    cat.editAsText().setFontFamily("Arial").setFontSize(11).setBold(true).setForegroundColor("#333333");
    cat.setIndentStart(20);
    groupe.items.forEach(function (item) {
      const li = body.appendListItem(item);
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      li.editAsText().setFontFamily("Arial").setFontSize(11).setBold(false).setForegroundColor("#333333");
      li.setIndentStart(56); li.setIndentFirstLine(36);
    });
  });
  body.appendParagraph("");

  ajouterH2(body, "3. Livrables produits cette semaine");
  if (c.livrables && c.livrables.length > 0) {
    c.livrables.forEach(function (item) {
      const li = body.appendListItem(item);
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      li.editAsText().setFontFamily("Arial").setFontSize(11).setForegroundColor("#333333");
      li.setIndentStart(36); li.setIndentFirstLine(20);
    });
  } else {
    body.appendParagraph("Aucun livrable produit cette semaine.")
      .editAsText().setFontFamily("Arial").setFontSize(11).setItalic(true).setForegroundColor("#888888");
  }
  body.appendParagraph("");

  ajouterH2(body, "4. Tests effectués");
  if (c.tests_effectues && c.tests_effectues.length > 0) {
    c.tests_effectues.forEach(function (item) {
      const li = body.appendListItem(item);
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      li.editAsText().setFontFamily("Arial").setFontSize(11).setForegroundColor("#333333");
      li.setIndentStart(36); li.setIndentFirstLine(20);
    });
  } else {
    body.appendParagraph("Aucun test spécifique réalisé cette semaine.")
      .editAsText().setFontFamily("Arial").setFontSize(11).setItalic(true).setForegroundColor("#888888");
  }
  body.appendParagraph("");

  ajouterH2(body, "5. Difficultés rencontrées / points d'attention");
  if (c.difficultes && c.difficultes.length > 0) {
    c.difficultes.forEach(function (item) {
      const li = body.appendListItem(item);
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      li.editAsText().setFontFamily("Arial").setFontSize(11).setForegroundColor("#333333");
      li.setIndentStart(36); li.setIndentFirstLine(20);
    });
  } else {
    body.appendParagraph("Aucun blocage majeur rencontré cette semaine.")
      .editAsText().setFontFamily("Arial").setFontSize(11).setItalic(true).setForegroundColor("#888888");
  }
  body.appendParagraph("");

  ajouterH2(body, "6. Planification de la semaine prochaine");
  if (c.planification && c.planification.length > 0) {
    c.planification.forEach(function (item) {
      const li = body.appendListItem(item);
      li.setGlyphType(DocumentApp.GlyphType.BULLET);
      li.editAsText().setFontFamily("Arial").setFontSize(11).setForegroundColor("#333333");
      li.setIndentStart(36); li.setIndentFirstLine(20);
    });
  } else {
    body.appendParagraph("Objectifs à définir pour la semaine prochaine.")
      .editAsText().setFontFamily("Arial").setFontSize(11).setItalic(true).setForegroundColor("#888888");
  }
  body.appendParagraph("");

  ajouterH2(body, "7. Conclusion");
  body.appendParagraph(c.conclusion)
    .editAsText().setFontFamily("Arial").setFontSize(11).setForegroundColor("#333333");
  body.appendParagraph("");

  body.appendHorizontalRule();
  body.appendParagraph("Rédigé le : " + formaterDateFR(new Date()) + "    Par : " + CONFIG.NOM_PRENOM)
    .editAsText().setFontFamily("Arial").setFontSize(10).setItalic(true).setForegroundColor("#888888");

  doc.saveAndClose();
  const fichier = DriveApp.getFileById(doc.getId());
  dossier.addFile(fichier);
  try { DriveApp.getRootFolder().removeFile(fichier); } catch (e) {}

  return DocumentApp.openById(doc.getId());
}

function ajouterH2(body, texte) {
  const p = body.appendParagraph(texte);
  p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  p.editAsText().setFontFamily("Arial").setFontSize(12).setBold(true).setForegroundColor("#1a1a2e");
  return p;
}

// ╔══════════════════════════════════════════════════════════════╗
//  ARCHIVAGE + REMISE À ZÉRO DU DOC DE NOTES
// ╚══════════════════════════════════════════════════════════════╝

function archiverNotes(notesDoc, nomFichier) {
  const texteNotes = notesDoc.getBody().getText();
  const dossier = DriveApp.getFolderById(CONFIG.DOSSIER_RAPPORTS_ID);
  const it = dossier.getFoldersByName("Archives notes");
  const dossierArchive = it.hasNext() ? it.next() : dossier.createFolder("Archives notes");
  dossierArchive.createFile("Notes brutes — " + nomFichier + ".txt", texteNotes, "text/plain");

  const body = notesDoc.getBody();
  body.clear();

  const titrePara = body.appendParagraph("Notes de la semaine — " + getLibelleSemaineProchaine());
  titrePara.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  titrePara.editAsText().setForegroundColor("#1a73e8").setFontFamily("Arial");

  body.appendParagraph("Écrivez librement tout ce que vous faites. L'IA s'occupe du reste vendredi matin.")
    .editAsText().setItalic(true).setForegroundColor("#999999").setFontSize(11).setFontFamily("Arial");

  body.appendHorizontalRule();

  // ✅ NOUVEAU — Section pour guider l'IA sur les points importants
  ajouterSectionNotes(body, "Points importants à mettre en avant",
    "Ex : Le sitemap est un livrable clé. Sur Lexxy, je suis testeur uniquement.");

  ajouterSectionNotes(body, "Tâches réalisées",            "Ex : Développement de la fonctionnalité X, réunion avec Y...");
  ajouterSectionNotes(body, "Points de blocage",            "Ex : Problème avec la librairie X, manque de doc sur Y...");
  ajouterSectionNotes(body, "Objectifs semaine prochaine",  "Ex : Finir le module A, intégrer avec Norman...");
  ajouterSectionNotes(body, "Tests effectués",              "Ex : Tests unitaires API réservation...");
  ajouterSectionNotes(body, "Livrables produits",           "Ex : Documentation API, modèle de données...");

  notesDoc.saveAndClose();
}

function ajouterSectionNotes(body, titre, placeholder) {
  const h = body.appendParagraph(titre);
  h.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  h.editAsText().setFontSize(12).setBold(true).setForegroundColor("#333333").setFontFamily("Arial");
  body.appendParagraph(placeholder)
    .editAsText().setItalic(true).setForegroundColor("#bbbbbb").setFontSize(11).setFontFamily("Arial");
  body.appendParagraph("");
}

// ╔══════════════════════════════════════════════════════════════╗
//  UTILITAIRES DATE (français)
// ╚══════════════════════════════════════════════════════════════╝

function formaterDateFR(date) {
  const mois = ["janvier","février","mars","avril","mai","juin",
                 "juillet","août","septembre","octobre","novembre","décembre"];
  return date.getDate() + " " + mois[date.getMonth()] + " " + date.getFullYear();
}

function getLibelleSemaine() {
  const today = new Date();
  const diffLundi = today.getDay() === 0 ? -6 : 1 - today.getDay();
  const lundi = new Date(today); lundi.setDate(today.getDate() + diffLundi);
  const vendredi = new Date(lundi); vendredi.setDate(lundi.getDate() + 4);
  return formaterDateFR(lundi) + " au " + formaterDateFR(vendredi);
}

function getLibelleSemaineProchaine() {
  const today = new Date();
  const diff = today.getDay() === 0 ? 1 : 8 - today.getDay();
  const lundi = new Date(today); lundi.setDate(today.getDate() + diff);
  const vendredi = new Date(lundi); vendredi.setDate(lundi.getDate() + 4);
  return formaterDateFR(lundi) + " au " + formaterDateFR(vendredi);
}

function creerNomFichier() {
  return "Rapport — Semaine du " + getLibelleSemaine();
}

// ╔══════════════════════════════════════════════════════════════╗
//  DÉCLENCHEUR AUTOMATIQUE — Lancer UNE SEULE FOIS
// ╚══════════════════════════════════════════════════════════════╝

function installerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    ScriptApp.deleteTrigger(t);
  });

  // Commits tous les jours à 16h00
  ScriptApp.newTrigger("recupererEtAjouterCommits")
    .timeBased()
    .everyDays(1)
    .atHour(CONFIG.HEURE_COMMITS)
    .nearMinute(CONFIG.MINUTE_COMMITS)
    .create();

  // Rapport tous les vendredis à 16h30
  ScriptApp.newTrigger("genererRapportsHebdomadaires")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(CONFIG.HEURE_DECLENCHEMENT)
    .nearMinute(CONFIG.MINUTE_DECLENCHEMENT)
    .create();

  Logger.log("✅ Trigger commits : tous les jours à " + CONFIG.HEURE_COMMITS + "h" + CONFIG.MINUTE_COMMITS + "0");
  Logger.log("✅ Trigger rapport : tous les vendredis à " + CONFIG.HEURE_DECLENCHEMENT + "h" + CONFIG.MINUTE_DECLENCHEMENT);
}