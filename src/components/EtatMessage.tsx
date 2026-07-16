/**
 * Encart d'information neutre : aucune semaine active, base injoignable, liste vide…
 * Rendu côté serveur, sans état.
 */
export interface EtatMessageProps {
  titre: string;
  children?: React.ReactNode;
  ton?: "neutre" | "erreur";
}

export function EtatMessage({ titre, children, ton = "neutre" }: EtatMessageProps) {
  const bordure = ton === "erreur" ? "border-destructive/50" : "border-border";

  return (
    <div className={`rounded-lg border ${bordure} bg-muted/30 p-6`}>
      <h2 className={`font-medium ${ton === "erreur" ? "text-destructive" : ""}`}>{titre}</h2>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
