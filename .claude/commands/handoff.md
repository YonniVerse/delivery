---
description: Clôture la session — met à jour CHANGELOG et NEXT_SESSION, vérifie l'état, propose un commit
---

Tu prépares la **passation de fin de session** pour le projet Delivery. Objectif : qu'une future
session Claude puisse reprendre instantanément avec le bon contexte. Procède ainsi :

1. **Fais le bilan de la session** : liste ce qui a réellement changé (fichiers créés/modifiés,
   tests ajoutés, tâches de la roadmap terminées). Base-toi sur `git status`/`git diff` et sur la
   conversation, pas sur des suppositions.

2. **Vérifie la santé du projet** (si le scaffolding existe) : lance `npm run test:run` et
   `npm run typecheck`. Note les résultats. Ne masque aucun échec.

3. **Mets à jour `CHANGELOG.md`** : ajoute les changements visibles sous la section `## [Non publié]`
   (rubriques Ajouté/Modifié/Corrigé). Style concis, en français.

4. **Réécris `NEXT_SESSION.md`** pour refléter l'état réel :
   - Phase courante et ce qui est fait / pas fait
   - **La prochaine action concrète** (le prochain test à écrire en TDD, précis)
   - Tout piège ou décision en suspens rencontré cette session
   - Garde le fichier court et actionnable

5. **Décisions durables** : si une décision d'architecture non triviale a été prise, l'ajouter à
   la section « décisions verrouillées » de `NEXT_SESSION.md` et à `docs/PLAN.md` si pertinent.

6. **Propose un commit** : affiche un message de commit clair et atomique et demande à l'utilisateur
   s'il veut que tu commits. Ne commit pas sans son accord.

7. **Résumé final** à l'utilisateur : 3-5 lignes — ce qui a avancé, l'état des tests, et la première
   chose à faire à la prochaine session.

Arguments éventuels (`$ARGUMENTS`) : notes libres de l'utilisateur à intégrer dans la passation.
