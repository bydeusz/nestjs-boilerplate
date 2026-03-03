# Tickets Checklist

Kan je voor mij een plan maken voor Ticket 9 uit het @tickets.md bestand? Je kunt @project.md gebruiken voor een volledige project beschrijving. Kijk ook goed naar de project structuur bij het maken van beslissingen. Vergeet ook niet de docs van nest js en prisma te bekijken. Vergeet ook niet het ticket te markeren als done.

## Phase 1 — Project foundation

- [x] Ticket 1 — Initialiseer NestJS project en basis configuratie  
  **Beschrijving:** Initialiseer een nieuw NestJS project met de Nest CLI en configureer TypeScript, ESLint en Prettier. Zorg dat de basisstructuur correct werkt met `main.ts` en `app.module.ts` als entry points.

- [x] Ticket 2 — Configureer environment variables en ConfigModule  
  **Beschrijving:** Installeer en configureer ConfigModule om environment variables te laden via `.env` bestanden. Voeg environment validatie toe zodat verplichte variabelen zoals `DATABASE_URL` en `JWT_SECRET` gecontroleerd worden bij startup.

- [x] Ticket 3 — Setup globale ValidationPipe en basis app bootstrap configuratie  
  **Beschrijving:** Configureer ValidationPipe globaal zodat alle inkomende requests automatisch gevalideerd worden. Configureer ook globale prefix (`/api`), CORS en basis security instellingen.

- [x] Ticket 4 — Docker setup voor lokale development omgeving  
  **Beschrijving:** Maak een `Dockerfile` en `docker-compose.yml` voor PostgreSQL, Minio voor S3 en Redis. Zorg dat de volledige development omgeving met een command gestart kan worden. Ik wil graag een _docker folder waar alles in staat voor docker. Ik wil ook graag een project naam kunne toevoegen aan het begin van het docker document.

## Phase 2 — Database setup

- [x] Ticket 5 — Installeer en configureer Prisma ORM  
  **Beschrijving:** Installeer Prisma en configureer `schema.prisma` met PostgreSQL connectie. Genereer Prisma client en valideer dat database connectie werkt.

- [x] Ticket 6 — Implementeer PrismaService en PrismaModule  
  **Beschrijving:** Maak een singleton PrismaService die database connectie beheert binnen NestJS. Zorg voor correcte lifecycle handling met graceful shutdown.

- [x] Ticket 7 — Setup Prisma migrations workflow  
  **Beschrijving:** Configureer Prisma migrations zodat database schema wijzigingen veilig toegepast kunnen worden. Voeg scripts toe voor `migrate dev` en `migrate deploy`.

- [x] Ticket 8 — Setup database seed script  
  **Beschrijving:** Maak een seed script voor initiële data zoals admin users en basis configuratie. Zorg dat deze via npm script uitgevoerd kan worden.

## Phase 3 — Core infrastructure

- [x] Ticket 9 — Implementeer globale exception handling  
  **Beschrijving:** Maak een globale exception filter die alle errors opvangt en uniforme error responses retourneert. Zorg dat errors correct gelogd worden.

- [x] Ticket 10 — Implementeer globale response transform interceptor  
  **Beschrijving:** Maak een interceptor die alle responses formatteert naar een consistente structuur met `success`, `data` en `meta` velden. Dit zorgt voor consistente API responses.

- [x] Ticket 11 — Implementeer logging systeem  
  **Beschrijving:** Integreer structured logging met Pino of Winston voor request logging en error logging. Zorg dat logs bruikbaar zijn voor debugging en monitoring. Je mag de logs in de logs folder plaatsen.

- [x] Ticket 12 — Implementeer request ID tracking middleware  
  **Beschrijving:** Voeg middleware toe die elke request een unieke ID geeft. Dit maakt debugging en tracing van requests mogelijk.

## Phase 4 — Authentication and authorization

- [x] Ticket 13 — Implementeer User module met Prisma integratie  
  **Beschrijving:** Maak User module met CRUD functionaliteit en Prisma integratie. Definieer User model in Prisma schema en implementeer database queries. De volgende elementen moeten bij een user horen. Name, Surname, e-mail, password, is_admin, Organisation (onder welke organisatie de user valt).

  - [x] Ticket 13.1 — Implementeer Organisatie module met Prisma integratie  
  **Beschrijving:** Maak een Organisatie module met CRUD functionaliteit en Prisma integratie. Definieer een `Organisation` model in het Prisma schema met de velden: `name`, `address`, `postalCode`, `city`, `kvk`, `vatNumber` en `iban`. `kvk`, `vatNumber` en `iban` zijn optioneel. Leg daarnaast de relatie vast dat users onderdeel zijn van een organisatie.

  - [x] Ticket 13.2 — Voeg Prisma seeders toe voor dummy data  
  **Beschrijving:** Maak in `prisma` een `seeders` folder en voeg aparte seed bestanden toe voor `users` en `organisation`. Zorg dat deze seeders gekoppeld en uitgevoerd worden via `prisma/seed.ts`, zodat de database bij seeden direct gevuld wordt met dummy data inclusief user-organisation relaties.

- [x] Ticket 14 — Implementeer password hashing functionaliteit  
  **Beschrijving:** Integreer bcrypt voor veilige password hashing en verificatie. Zorg dat passwords nooit als plain text opgeslagen worden.

- [x] Ticket 15 — Implementeer JWT authentication systeem  
  **Beschrijving:** Implementeer JWT token generatie en validatie. Configureer JWT module met secret en expiration settings.

- [x] Ticket 16 — Implementeer Auth module met login en register endpoints  
  **Beschrijving:** Maak endpoints voor login en registratie met JWT token generatie. Zorg voor correcte validatie en error handling. Ik wil via een .env file kunnen bepalen met welke domein namen een user kan registreren. gmail.com,bydeusz.com enzovoorts.

  - [x] Ticket 16.1 — Implementeer publieke gebruikersregistratie met feature flag  
  **Beschrijving:** Maak een publiek `POST /api/auth/register` endpoint waarmee nieuwe gebruikers zichzelf kunnen registreren zonder bestaand account. Dit endpoint vereist geen authenticatie. Geregistreerde gebruikers krijgen altijd `isAdmin: true`. De feature is aan/uit te schakelen via een `REGISTRATION_ENABLED` variabele in de `.env` file (`true` of `false`). Wanneer registratie uitgeschakeld is, retourneert het endpoint een `403 Forbidden`.  
  
  **Vereiste input:** `name`, `surname`, `email`, `password`.  
  
  **Organisatie-dependency:** Omdat een nieuwe gebruiker nog geen organisatie heeft, moet `organisationId` nullable worden gemaakt in het Prisma schema (`organisationId String?` en de relatie `organisation Organisation? @relation(...)`). Dit vereist een schema wijziging en migratie. Gebruikers zonder organisatie kunnen later via een apart proces (admin-toewijzing of zelf-onboarding) aan een organisatie gekoppeld worden. Bestaande endpoints die users aanmaken (admin CRUD) blijven `organisationId` verplicht meesturen via DTO-validatie.  
  
  **Subtaken:**
  - Voeg `REGISTRATION_ENABLED` toe aan `.env` en environment validatie
  - Maak `organisationId` nullable in Prisma schema + migratie
  - Pas bestaande `CreateUserDto` aan zodat `organisationId` via DTO-validatie nog steeds verplicht is voor admin-aanmaak
  - Implementeer `RegisterDto` (zonder `organisationId` en `isAdmin`)
  - Implementeer registratie-endpoint in Auth module met feature flag guard/check
  - Retourneer JWT tokens bij succesvolle registratie
  - Pas seed data aan indien nodig

- [x] Ticket 17 — Implementeer JWT Auth Guard  
  **Beschrijving:** Maak guard die JWT tokens valideert en routes beschermt. Zorg dat authenticated user beschikbaar is in request context.

- [x] Ticket 18 — Implementeer Role-based access control (RBAC)  
  **Beschrijving:** Implementeer roles en roles guard om toegang te beperken op basis van user roles. Maak roles decorator voor eenvoudige toepassing op endpoints.

- [x] Ticket 19 — Implementeer refresh token mechanisme  
  **Beschrijving:** Voeg ondersteuning toe voor refresh tokens zodat users nieuwe access tokens kunnen verkrijgen. Dit verhoogt security en usability.

  - [x] Ticket 19.1 — Implementeer wachtwoord wijzigen endpoint  
  **Beschrijving:** Maak een beveiligd endpoint waarmee een ingelogde user zijn eigen wachtwoord kan wijzigen. Valideer het huidige wachtwoord voordat het nieuwe wachtwoord wordt ingesteld. Gebruik bcrypt voor hashing en retourneer een duidelijke foutmelding bij een onjuist huidig wachtwoord.

## Phase 5 — API standaardisatie

- [x] Ticket 20 — Implementeer pagination systeem  
  **Beschrijving:** Maak pagination DTO en utilities voor consistente pagination. Zorg dat endpoints pagination ondersteunen.

- [x] Ticket 21 — Implementeer base DTO en response types  
  **Beschrijving:** Maak standaard DTO's en interfaces voor consistente API responses. Dit maakt frontend integratie eenvoudiger.

- [x] Ticket 22 — Implementeer API versioning  
  **Beschrijving:** Configureer NestJS versioning zodat meerdere API versies ondersteund worden. Gebruik bijvoorbeeld `/v1` prefix.

## Phase 6 — Security

- [x] Ticket 23 — Configureer Helmet security middleware  
  **Beschrijving:** Integreer Helmet middleware voor security headers. Dit beschermt tegen bekende web vulnerabilities.

- [x] Ticket 24 — Configureer rate limiting  
  **Beschrijving:** Implementeer rate limiting met Throttler module. Dit voorkomt abuse en brute force aanvallen.

- [x] Ticket 25 — Configureer CORS policy  
  **Beschrijving:** Configureer CORS om alleen toegestane domains toegang te geven. Dit verhoogt security.

## Phase 7 — Redis, caching en queues

- [x] Ticket 26 — Implementeer Redis module  
  **Beschrijving:** Configureer Redis integratie voor caching en background jobs. Zorg voor correcte connectie handling.

- [x] Ticket 27 — Implementeer caching support  
  **Beschrijving:** Voeg caching toe voor performance kritieke queries. Gebruik Redis als cache storage.

- [x] Ticket 28 — Implementeer queue systeem met BullMQ  
  **Beschrijving:** Configureer queue systeem voor background jobs zoals email verzending. Zorg voor queue processors.

## Phase 8 — Mail en file handling

- [x] Ticket 29 — Implementeer Mail module  
  **Beschrijving:** Configureer mail service met SMTP ondersteuning. Zorg dat emails verstuurd kunnen worden via templates. Gebruik hier nodemailer voor. Sla voor nu de SMTP gegevens op in de .env file.

- [x] Ticket 31 — Implementeer S3 storage support met minio  
  **Beschrijving:** Voeg ondersteuning toe voor file uploads naar minio. Dit maakt file storage schaalbaar. Ik wil dat je een globaal object maakt die ik op meerdere plekken kan inzetten zoals het uploaden van een avatar voor een user en een logo voor een organisatie.

## Phase 9 — Monitoring en health

- [ ] Ticket 32 — Implementeer Health module  
  **Beschrijving:** Maak health endpoint voor monitoring. Zorg dat API status gecontroleerd kan worden.

- [ ] Ticket 33 — Implementeer database health check  
  **Beschrijving:** Voeg database connectie health check toe. Dit detecteert database problemen.

- [ ] Ticket 34 — Implementeer Redis health check  
  **Beschrijving:** Voeg Redis health check toe. Dit detecteert caching en queue problemen.

## Phase 10 — Documentation

- [ ] Ticket 35 — Implementeer Swagger documentatie  
  **Beschrijving:** Configureer Swagger voor automatische API documentatie. Maak docs beschikbaar via endpoint.


## Phase 11 — Production readiness

- [ ] Ticket 38 — Implementeer graceful shutdown handling  
  **Beschrijving:** Zorg dat applicatie netjes afsluit en database connecties sluit. Dit voorkomt data corruptie.

- [ ] Ticket 39 — Configureer production logging  
  **Beschrijving:** Configureer logging voor production gebruik. Zorg dat logs bruikbaar zijn voor monitoring systemen.

- [ ] Ticket 40 — Finaliseer production Docker configuratie  
  **Beschrijving:** Optimaliseer Docker setup voor production deployments. Zorg voor kleine image en veilige configuratie. Er moet ook een Nest JS container komen van de applicatie deze zit nog niet in de docker workflow.
