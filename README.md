## Questions (pas très importantes, juste pour information)
* gateway/src/server.ts: Pourquoi pas de 'disableRequestLogging' ?
* Pourquoi on n'utilise pas ORM ?
* Pourquoi deux façons pour que les conteneurs communiquent : fetch (in server.get('/aggregated/profile') et rabbit mesages ?
* Pourquoi '/auth' (sauf '/auth/update', '/auth/enable-2fa', '/auth/disable-2fa') est exclue de verifyJWT ?
* Pourquoi nginx ne s'occupe pas de routage ?
* Un service publie via Rabbit un update de données -> l'autre service met à jour sa DB, pour quel but ce deuxième service publie le message d'acceptation ?
* On peut utiliser UUID рour avoir un id commun pour deux tables 'users' et 'profiles' ?
* docker-compose.yml: `working_dir: /app` est inutile ? on a `WORKDIR /app` dans Docekfile
* chatState.js: Quand on change d’interlocuteur, `fetchMessagesForUser` fetche à chaque fois tous les messages de l’utilisateur, pas seulement ceux liés à ce chat
* chatState.ts: Pourquoi allChats, pendingChats sont sauvegardés en inMemory storage et pas en localStorage ? (si F5, on perd les messages non-envoyés)
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
  + index.html: 2 fois `defer` (juste déjà `defer` par default)

