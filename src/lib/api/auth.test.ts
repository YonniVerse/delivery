import { describe, it, expect } from "vitest";
import { isAuthorized, unauthorized } from "./auth";

const SECRET = "s3cr3t-de-cron";

function req(authorization?: string): Request {
  return new Request("https://exemple.test/api/cron/commits", {
    headers: authorization ? { Authorization: authorization } : {},
  });
}

describe("isAuthorized", () => {
  it("accepte le bon secret en Bearer", () => {
    expect(isAuthorized(req(`Bearer ${SECRET}`), SECRET)).toBe(true);
  });

  it("refuse l'absence d'en-tête Authorization", () => {
    expect(isAuthorized(req(), SECRET)).toBe(false);
  });

  it("refuse un mauvais secret", () => {
    expect(isAuthorized(req("Bearer mauvais"), SECRET)).toBe(false);
  });

  it("refuse un autre schéma d'authentification", () => {
    expect(isAuthorized(req(`Basic ${SECRET}`), SECRET)).toBe(false);
  });

  it("refuse un secret vide même si l'en-tête est bien formé", () => {
    expect(isAuthorized(req("Bearer "), "")).toBe(false);
  });

  it("refuse quand le secret attendu est vide (config manquante)", () => {
    expect(isAuthorized(req("Bearer quoiquecesoit"), "")).toBe(false);
  });

  it("est insensible à la casse du schéma (Vercel Cron)", () => {
    expect(isAuthorized(req(`bearer ${SECRET}`), SECRET)).toBe(true);
  });

  it("refuse un secret qui n'est qu'un préfixe du bon", () => {
    expect(isAuthorized(req(`Bearer ${SECRET.slice(0, 5)}`), SECRET)).toBe(false);
  });
});

describe("unauthorized", () => {
  it("renvoie un 401 JSON sans détail exploitable", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    await expect(res.json()).resolves.toEqual({ ok: false, error: "Non autorisé" });
  });
});
