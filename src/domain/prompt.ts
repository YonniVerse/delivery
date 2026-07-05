/**
 * Construction du prompt IA — porté fidèlement de code.gs
 * (genererDeuxVersionsAvecGroq). Fonction pure : mêmes entrées → même prompt.
 */

export interface ProjetContexte {
  nom: string;
  role: string;
  description: string;
}

export interface PromptInput {
  nomPrenom: string;
  semaine: string;
  projets: ProjetContexte[];
  /** Notes brutes déjà agrégées (voir notesToPromptText). */
  notesText: string;
}

const MAX_NOTES = 10000;

export function buildReportPrompt(input: PromptInput): string {
  const { nomPrenom, semaine, projets, notesText } = input;

  const contextesProjets = projets
    .map((p) => `- ${p.nom} : ${p.role} — ${p.description}`)
    .join("\n");

  return (
    "Tu es un assistant qui aide un stagiaire développeur à transformer ses notes brutes en rapports professionnels.\n\n" +
    "CONTEXTE STAGIAIRE :\n" +
    `- Stagiaire : ${nomPrenom}\n` +
    `- Semaine : ${semaine}\n\n` +
    "RÔLES SUR LES PROJETS (respecte-les STRICTEMENT) :\n" +
    contextesProjets +
    "\n\n" +
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
    "NOTES BRUTES :\n---\n" +
    notesText.substring(0, MAX_NOTES) +
    "\n---\n\n" +
    "Génère DEUX versions. Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backtick.\n\n" +
    "RÈGLE sur les projets :\n" +
    "- UN seul projet dans les notes → format un projet\n" +
    "- PLUSIEURS projets dans les notes → format plusieurs projets, dissocie-les\n\n" +
    "FORMAT JSON — UN SEUL PROJET :\n" +
    "{\n" +
    '  "long": {\n' +
    '    "objet": "Paragraphe introductif (3-5 phrases), semaine + projet + bilan global.",\n' +
    '    "activites_realisees": [{"categorie": "Nom catégorie", "items": ["Action 1", "Action 2"]}],\n' +
    '    "livrables": ["Livrable 1"],\n' +
    '    "tests_effectues": ["Test 1"],\n' +
    '    "difficultes": ["Point attention 1"],\n' +
    '    "planification": ["Objectif 1"],\n' +
    '    "conclusion": "Paragraphe conclusion (3-4 phrases)."\n' +
    "  },\n" +
    '  "court": {\n' +
    `    "intro": "Voici un résumé des travaux réalisés durant la semaine du ${semaine}, consacrée à [résumé 1 ligne].",\n` +
    '    "projets": [{\n' +
    '      "nom": "Nom du projet",\n' +
    '      "points_cles": [{"categorie": "Nom court", "description": "description concise"}],\n' +
    '      "livrables": ["Livrable court 1"],\n' +
    '      "difficultes": ["Difficulté 1"]\n' +
    "    }],\n" +
    '    "objectifs": ["Objectif 1", "Objectif 2"]\n' +
    "  }\n" +
    "}\n\n" +
    "FORMAT JSON — PLUSIEURS PROJETS :\n" +
    "{\n" +
    '  "long": {\n' +
    '    "objet": "Paragraphe introductif mentionnant tous les projets.",\n' +
    '    "activites_realisees": [\n' +
    '      {"categorie": "Projet X — Catégorie", "items": ["Action 1"]},\n' +
    '      {"categorie": "Projet Y — Catégorie", "items": ["Action 1"]}\n' +
    "    ],\n" +
    '    "livrables": ["Livrable X", "Livrable Y"],\n' +
    '    "tests_effectues": ["Test 1"],\n' +
    '    "difficultes": ["Point attention 1"],\n' +
    '    "planification": ["Objectif 1", "Objectif 2"],\n' +
    '    "conclusion": "Paragraphe conclusion mentionnant tous les projets."\n' +
    "  },\n" +
    '  "court": {\n' +
    `    "intro": "Voici un résumé des travaux réalisés durant la semaine du ${semaine}, consacrée à [résumé mentionnant les projets].",\n` +
    '    "projets": [\n' +
    '      {"nom": "Projet 1", "points_cles": [{"categorie": "Nom", "description": "desc"}], "livrables": ["L1"], "difficultes": ["D1"]},\n' +
    '      {"nom": "Projet 2", "points_cles": [{"categorie": "Nom", "description": "desc"}], "livrables": ["L1"], "difficultes": ["D1"]}\n' +
    "    ],\n" +
    '    "objectifs": ["Objectif global 1", "Objectif global 2"]\n' +
    "  }\n" +
    "}\n\n" +
    "RAPPELS FINAUX :\n" +
    `- "intro" commence TOUJOURS par "Voici un résumé des travaux réalisés durant la semaine du ${semaine}, consacrée à..."\n` +
    "- Pas de tests → tableau vide []\n" +
    "- Pas de difficultés majeures → mettre les points à surveiller\n" +
    "- Réponds UNIQUEMENT avec le JSON, rien d'autre"
  );
}
