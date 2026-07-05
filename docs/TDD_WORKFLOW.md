# Workflow TDD — Delivery

Le développement suit un **TDD strict**. Aucune ligne de code de production n'est écrite sans un
test qui échoue au préalable.

## La boucle : Red → Green → Refactor
1. **Red** — Écrire un test qui décrit le comportement voulu. Le lancer, vérifier qu'il **échoue**
   pour la bonne raison (pas une erreur de syntaxe/import).
2. **Green** — Écrire le **minimum** de code pour faire passer le test. Rien de plus.
3. **Refactor** — Nettoyer (nommage, duplication, structure) en gardant les tests **verts**.

Répéter par très petits pas. Committer quand un cycle est vert et cohérent (sur demande de l'utilisateur).

## Ordre de développement
1. **Domaine pur d'abord** (`src/domain/`) : dates, notes, prompt, schémas. Facile à tester, zéro I/O.
2. **Intégrations ensuite** (`src/lib/`) : IA, GitHub, Google, Supabase — avec **I/O mockées**.
3. **Orchestration** : pipelines (génération rapport, import commits) testés bout-en-bout mockés.
4. **UI & API** : composants (Testing Library), routes (Vitest), puis **e2e Playwright**.

## Règles de test
- Un test = un comportement. Nom explicite (`it("formate une date en français")`).
- **Arrange / Act / Assert** clair.
- Mocker uniquement les frontières externes (réseau, Supabase, Google, IA). Ne pas mocker le domaine.
- Cas limites obligatoires : erreurs API (401/404/500), listes vides, mono vs multi-projets,
  dimanche/changement de mois pour les dates, réponses IA malformées.
- Les tests ne doivent **jamais** appeler de vrais services externes ni de vraies clés.

## Commandes
```
npm run test        # watch — mode par défaut pendant le TDD
npm run test:run    # une passe complète
npm run typecheck   # tsc --noEmit
```

## Définition de "terminé" pour une tâche
- [ ] Test(s) écrits en premier et pertinents (cas nominal + limites)
- [ ] Tous les tests verts, `typecheck` et `lint` OK
- [ ] Code refactoré, sans duplication évidente
- [ ] `CHANGELOG.md` (Non publié) mis à jour si comportement visible
- [ ] `NEXT_SESSION.md` reflète le nouvel état (via `/handoff` en fin de session)
