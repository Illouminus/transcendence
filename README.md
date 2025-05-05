## Questions
* Pourquoi pas de 'disableRequestLogging' dans gateway/src/server.ts ?
* Pourquoi on n'utilise pas ORM ?
* Pourquoi deux façons pour que les conteneurs communiquent : fetch (in server.get('/aggregated/profile') et rabbit mesages ?
* Pourquoi un seul endpoint '/auth' (sauf '/auth/update', '/auth/enable-2fa', '/auth/disable-2fa') est exclue de verifyJWT ?
* Pourquoi nginx ne s'occupe pas de routage ?
* Un service publie via Rabbit un update de données -> l'autre service met à jour sa DB, pour quel but ce deuxième service publie le messqge d'acceptation ?
* On peut utiliser UUID рour avoir un id commun pour deux tables 'users' et 'profiles' ?
* Ces components ne sont pas utilisés ?
  + 'sendEmail' dans conteneur 'user'
  + 'declare module "fastify"'
  + 'frontend/yarn.lock'
  + champ 'created_at' de la table 'sessions'
  + champ 'created_at' de la table 'conversations'
  + champ 'created_at' de la table 'tournaments'
  + champ 'created_at' de la table 'user_profile'
  + champ 'created_at' de la table 'friends'
  + backend/game/src/rabbit/connectRabbit()
* Toute petites questions
  + `working_dir: /app` in dopcker-compose inutile, car on a `WORKDIR /app` dans Docekfile ?
