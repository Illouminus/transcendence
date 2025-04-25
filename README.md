## A voir (?)
* je me connect avec le compte internet124816@gmail.com, mais ça ne marche pas avec internet12481632@gmail.com
  ![screencast-from-04-22-2025-035331-pm_xHvIjMef](https://github.com/user-attachments/assets/75af8113-374e-4598-a9ef-06eb0cb1fab6)
* confetti is not defined (des fois)
  ![Screenshot from 2025-04-22 16-38-56](https://github.com/user-attachments/assets/238a201e-b399-4e2b-aba1-21a2ea6b64c7)
* toujours le meme chiffre 3  
  ![Screenshot from 2025-04-22 16-41-51](https://github.com/user-attachments/assets/5784b356-b2bb-4714-af2c-dc869f84d834)
* friendSelect is null
  ![Screenshot from 2025-04-22 16-46-48](https://github.com/user-attachments/assets/86c15633-4529-4cd3-995e-dac8c8ccfe52)
* mdp 123456 accepté
* selectionner un niveau (easy / medium / hard) ne marche pas en Mozilla Firefox
  + sur Chrome ça fonctionne   

## Questions
* Pourquoi pas de 'disableRequestLogging' dans gateway/src/server.ts ?
* Pourquoi on n'utilise pas ORM ?
* Pourquoi deux façons pour que les conteneurs communiquent : fetch (in server.get('/aggregated/profile') et rabbit mesages ?
* Pourquoi un seul endpoint '/auth' (sauf '/auth/update', '/auth/enable-2fa', '/auth/disable-2fa') est exclue de verifyJWT ?
* Pourquoi nginx ne s'occupe pas de routage ?
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
