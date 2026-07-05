import { describe, it, expect } from "vitest";
import {
  formaterDateFR,
  getLibelleSemaine,
  getLibelleSemaineProchaine,
} from "./dates";

// Repères 2026 (mois 0-indexé dans le constructeur Date local) :
//  - lun 6 juillet, mer 8 juillet, dim 12 juillet
const lundi = new Date(2026, 6, 6);
const mercredi = new Date(2026, 6, 8);
const dimanche = new Date(2026, 6, 12);

describe("formaterDateFR", () => {
  it("formate une date au format jour mois-français année", () => {
    expect(formaterDateFR(new Date(2026, 6, 5))).toBe("5 juillet 2026");
  });

  it("gère les mois accentués (février, août, décembre)", () => {
    expect(formaterDateFR(new Date(2026, 1, 3))).toBe("3 février 2026");
    expect(formaterDateFR(new Date(2026, 7, 1))).toBe("1 août 2026");
    expect(formaterDateFR(new Date(2026, 11, 25))).toBe("25 décembre 2026");
  });
});

describe("getLibelleSemaine", () => {
  it("renvoie du lundi au vendredi de la semaine en cours (jour de semaine)", () => {
    expect(getLibelleSemaine(mercredi)).toBe("6 juillet 2026 au 10 juillet 2026");
  });

  it("rattache le dimanche à la semaine du lundi précédent", () => {
    expect(getLibelleSemaine(dimanche)).toBe("6 juillet 2026 au 10 juillet 2026");
  });
});

describe("getLibelleSemaineProchaine", () => {
  it("renvoie la semaine suivante depuis un jour de semaine", () => {
    expect(getLibelleSemaineProchaine(lundi)).toBe(
      "13 juillet 2026 au 17 juillet 2026",
    );
  });

  it("depuis un dimanche, renvoie la semaine qui commence le lendemain", () => {
    expect(getLibelleSemaineProchaine(dimanche)).toBe(
      "13 juillet 2026 au 17 juillet 2026",
    );
  });
});
