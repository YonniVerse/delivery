"use client";

/**
 * Éditeur des notes de la semaine : une zone de saisie par section, enregistrée
 * automatiquement après une courte pause de frappe.
 *
 * `saveSection` arrive par les props : le composant ne connaît ni Supabase ni le
 * réseau, ce qui le rend testable avec une simple fonction espionne.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { SECTION_KEYS, SECTION_TITLES, type SectionKey, type WeekNotes } from "@/domain/notes";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Pause de frappe avant enregistrement. */
export const DEBOUNCE_MS = 800;

/** Section alimentée par le cron GitHub : la saisir n'aurait aucun effet durable. */
const SECTION_AUTO: SectionKey = "commits";

const PLACEHOLDERS: Record<SectionKey, string> = {
  pointsImportants: "Ex : Le sitemap est un livrable clé. Sur Lexxy, je suis testeur uniquement.",
  tachesRealisees: "Ex : Développement de la fonctionnalité X, réunion avec Y...",
  pointsBlocage: "Ex : Problème avec la librairie X, manque de doc sur Y...",
  objectifs: "Ex : Finir le module A, intégrer avec Norman...",
  tests: "Ex : Tests unitaires API réservation...",
  livrables: "Ex : Documentation API, modèle de données...",
  commits: "Rempli automatiquement chaque jour depuis GitHub.",
};

type EtatSauvegarde = "repos" | "encours" | "enregistre" | "erreur";

const LIBELLE_ETAT: Record<Exclude<EtatSauvegarde, "repos">, string> = {
  encours: "Enregistrement…",
  enregistre: "Enregistré",
  erreur: "Échec de l'enregistrement",
};

export interface NotesEditorProps {
  initialNotes: WeekNotes;
  saveSection: (section: SectionKey, content: string) => Promise<void>;
}

export function NotesEditor({ initialNotes, saveSection }: NotesEditorProps) {
  const [valeurs, setValeurs] = useState<Record<SectionKey, string>>(() =>
    Object.fromEntries(SECTION_KEYS.map((k) => [k, initialNotes[k] ?? ""])) as Record<
      SectionKey,
      string
    >,
  );
  const [etats, setEtats] = useState<Partial<Record<SectionKey, EtatSauvegarde>>>({});

  const minuteurs = useRef<Partial<Record<SectionKey, ReturnType<typeof setTimeout>>>>({});
  /**
   * Numéro du dernier enregistrement lancé par section : le résultat d'un
   * enregistrement plus ancien qui reviendrait en retard doit être ignoré,
   * sinon il écraserait l'état d'une saisie plus récente.
   */
  const sequences = useRef<Partial<Record<SectionKey, number>>>({});

  useEffect(() => {
    const enCours = minuteurs.current;
    return () => {
      for (const t of Object.values(enCours)) if (t) clearTimeout(t);
    };
  }, []);

  const planifier = useCallback(
    (section: SectionKey, contenu: string) => {
      const precedent = minuteurs.current[section];
      if (precedent) clearTimeout(precedent);

      minuteurs.current[section] = setTimeout(() => {
        const seq = (sequences.current[section] ?? 0) + 1;
        sequences.current[section] = seq;
        const estObsolete = () => sequences.current[section] !== seq;

        setEtats((e) => ({ ...e, [section]: "encours" }));

        saveSection(section, contenu).then(
          () => {
            if (estObsolete()) return;
            setEtats((e) => ({ ...e, [section]: "enregistre" }));
          },
          () => {
            if (estObsolete()) return;
            setEtats((e) => ({ ...e, [section]: "erreur" }));
          },
        );
      }, DEBOUNCE_MS);
    },
    [saveSection],
  );

  function surSaisie(section: SectionKey, contenu: string) {
    setValeurs((v) => ({ ...v, [section]: contenu }));
    planifier(section, contenu);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Notes de la semaine</h1>
        <p className="text-sm text-muted-foreground">
          Écrivez librement tout ce que vous faites. L&apos;IA s&apos;occupe du reste vendredi matin.
        </p>
      </header>

      {SECTION_KEYS.map((section) => {
        const lectureSeule = section === SECTION_AUTO;
        const etat = etats[section];

        return (
          <div key={section} className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <Label htmlFor={`section-${section}`}>{SECTION_TITLES[section]}</Label>
              <span
                data-testid={`etat-${section}`}
                role="status"
                aria-live="polite"
                className={
                  etat === "erreur"
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {etat && etat !== "repos" ? LIBELLE_ETAT[etat] : ""}
              </span>
            </div>
            <Textarea
              id={`section-${section}`}
              value={valeurs[section]}
              readOnly={lectureSeule}
              placeholder={PLACEHOLDERS[section]}
              rows={lectureSeule ? 6 : 4}
              className={lectureSeule ? "bg-muted font-mono text-xs" : undefined}
              onChange={(e) => {
                if (lectureSeule) return;
                surSaisie(section, e.target.value);
              }}
            />
            {lectureSeule && (
              <p className="text-xs text-muted-foreground">
                Section alimentée automatiquement chaque jour depuis GitHub — non modifiable.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
