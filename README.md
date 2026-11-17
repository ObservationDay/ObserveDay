a. Explication de l’architectur

b. Instructions d’installation

c. Justification des choix techniques

- **Angular 16 et TypeScript :** Angular fournit les routes, les composants et les formulaires réactifs demandés dans le sujet. La version 16 est retenue car elle est proposée par l’exercice.
- **Node.js 18 :** il permet d’installer et de compiler l’application Angular 16.
- **Laravel 13 et PHP 8.4 :** Laravel fournit les migrations, l’accès à la base de données et la validation nécessaires pour gérer les ateliers et les formateurs.
- **Sanctum :** il permet de protéger les routes de l’API Laravel avec des jetons.
- **Flask et Python 3.12 :** Flask est léger et convient à l’API dédiée aux participants. Python peut appeler l’API Laravel pour consulter les ateliers et effectuer une inscription.
- **SQLAlchemy et Requests :** SQLAlchemy permet à Python d’enregistrer les comptes participants; Requests facilite les appels HTTP vers Laravel.
- **PostgreSQL 17 :** cette base relationnelle permet de lier les ateliers, les participants et les inscriptions tout en protégeant la cohérence des données.
- **REST et JSON :** ce format standard permet aux applications Angular, Laravel et Python d’échanger des données simplement.

d. Exemple d’échange entre API Python ↔ Laravel

