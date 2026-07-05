/**
 * Utilitaires de date en français.
 * Portés depuis code.gs — chaque fonction accepte une date de référence
 * injectable (par défaut « maintenant ») pour rester testable.
 */

const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

/** Formate une date en « 5 juillet 2026 ». */
export function formaterDateFR(date: Date): string {
  return `${date.getDate()} ${MOIS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

function ajouterJours(date: Date, jours: number): Date {
  const copie = new Date(date);
  copie.setDate(copie.getDate() + jours);
  return copie;
}

/** Libellé « lundi au vendredi » de la semaine contenant `ref`. */
export function getLibelleSemaine(ref: Date = new Date()): string {
  const decalageLundi = ref.getDay() === 0 ? -6 : 1 - ref.getDay();
  const lundi = ajouterJours(ref, decalageLundi);
  const vendredi = ajouterJours(lundi, 4);
  return `${formaterDateFR(lundi)} au ${formaterDateFR(vendredi)}`;
}

/** Libellé « lundi au vendredi » de la semaine suivant celle de `ref`. */
export function getLibelleSemaineProchaine(ref: Date = new Date()): string {
  const decalage = ref.getDay() === 0 ? 1 : 8 - ref.getDay();
  const lundi = ajouterJours(ref, decalage);
  const vendredi = ajouterJours(lundi, 4);
  return `${formaterDateFR(lundi)} au ${formaterDateFR(vendredi)}`;
}
