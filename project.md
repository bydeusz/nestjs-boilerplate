# NestJS Starter

## Core framework

- **NestJS Framework**: Framework voor het bouwen van schaalbare backend applicaties met modulaire structuur en dependency injection. Het biedt een sterke architectuur vergelijkbaar met enterprise frameworks zoals Spring.
- **Modules structuur**: Verdeelt je applicatie in logische onderdelen zoals `auth`, `users` en `mail`. Dit maakt je code onderhoudbaar en schaalbaar.
- **Dependency Injection**: Injecteert automatisch services in andere services of controllers. Dit maakt je code los gekoppeld en testbaar.
- **ConfigModule**: Beheert environment variabelen centraal in je app. Hiermee kun je eenvoudig verschillende configs per omgeving gebruiken.
- **Environment files (`.env`)**: Bevat configuratie zoals database URL en secrets. Hiermee scheid je development en production instellingen.
- **Environment validation**: Controleert of alle vereiste env variabelen aanwezig en correct zijn. Dit voorkomt runtime errors door ontbrekende configuratie.

## Database

- **Prisma**: Type-safe ORM voor database toegang en migrations. Het genereert TypeScript types voor veilige database queries.
- **PostgreSQL**: Relationele database die uitstekend werkt met Prisma. Het ondersteunt complexe queries en hoge performance.
- **PrismaService singleton**: Een gedeelde database service voor de hele app. Dit voorkomt connection leaks en performance problemen.
- **Migrations**: Scripts om database schema wijzigingen gecontroleerd door te voeren. Dit maakt deployments veilig en reproduceerbaar.
- **Seed script**: Script om initiale data in je database te plaatsen. Handig voor development en default users.
- **Soft delete support**: Markeert data als verwijderd zonder deze echt te verwijderen. Dit maakt herstel en auditing mogelijk.
- **Repository pattern (optioneel)**: Abstractielaag tussen database en business logic. Dit maakt je app flexibeler en testbaarder.
- **Prisma connection handling**: Beheert database connecties correct. Dit voorkomt memory leaks en crashes.

## Authentication & Authorization

- **JWT authentication**: Authenticeert users via tokens in plaats van sessies. Dit is schaalbaar en geschikt voor APIs.
- **Refresh tokens**: Gebruikt om nieuwe access tokens te genereren. Dit verhoogt security en usability.
- **Password hashing (`bcrypt`)**: Versleutelt wachtwoorden voordat ze opgeslagen worden. Dit voorkomt dat wachtwoorden uitlekken.
- **Auth module**: Beheert login, registratie en tokens. Dit vormt de basis van user authentication.
- **User module**: Beheert user CRUD en user data. Dit is de kern van account management.
- **Roles systeem**: Definieert rollen zoals admin en user. Hiermee kun je toegang controleren.
- **Permissions systeem**: Definieert toegangsrechten per actie. Dit maakt fijnmazige security mogelijk.
- **RBAC (Role-based access control)**: Beheert toegang op basis van rollen. Dit verhoogt controle over je systeem.
- **Guards**: Beschermen routes tegen ongeautoriseerde toegang. Ze controleren authenticatie en autorisatie.
- **JWT auth guard**: Controleert of een JWT token geldig is. Hiermee bescherm je private routes.
- **Roles guard**: Controleert of user de juiste rol heeft. Hiermee implementeer je RBAC.
- **Strategies**: Definieren hoe auth werkt, bijvoorbeeld JWT strategie. Ze integreren auth met NestJS.

## API & Request handling

- **ValidationPipe**: Valideert inkomende request data automatisch. Dit voorkomt invalid input.
- **Exception filters**: Vangen errors globaal op en formatteren responses. Dit zorgt voor consistente error handling.
- **Global exception handler**: Centrale plek voor error verwerking. Dit maakt debugging en logging makkelijker.
- **Interceptors**: Kunnen requests en responses aanpassen. Handig voor logging en response formatting.
- **Transform interceptor**: Zorgt voor consistente response structuur. Dit maakt je API voorspelbaar.
- **Timeout interceptor**: Stopt requests die te lang duren. Dit beschermt je server resources.
- **Decorators**: Helpers om data uit requests te halen. Ze maken controllers schoner.
- **Current user decorator**: Haalt ingelogde user uit request. Dit voorkomt herhaalde code.
- **Public decorator**: Markeert routes als publiek toegankelijk. Hiermee omzeil je auth guards.
- **Roles decorator**: Definieert welke rollen toegang hebben tot routes. Dit maakt autorisatie declaratief.

## API features

- **Pagination support**: Verdeelt data in paginas. Dit voorkomt performance problemen bij grote datasets.
- **Pagination DTO**: Standaard formaat voor pagination parameters. Dit maakt pagination consistent.
- **Response transformer**: Standaardiseert API responses. Dit maakt frontend integratie makkelijker.
- **API versioning**: Ondersteunt meerdere versies van je API. Dit voorkomt breaking changes.

## Security

- **Helmet**: Voegt security headers toe. Dit beschermt tegen bekende web aanvallen.
- **CORS config**: Controleert welke domains toegang hebben. Dit voorkomt ongeautoriseerde requests.
- **Rate limiting**: Beperkt aantal requests per user. Dit voorkomt abuse.
- **Input validation**: Controleert structuur van request data. Dit voorkomt invalid data.
- **Sanitization**: Verwijdert gevaarlijke input. Dit voorkomt injection aanvallen.

## Logging & Monitoring

- **Logging (`Pino`/`Winston`)**: Structured logging systeem voor je applicatie. Dit helpt bij debugging en monitoring.
- **Structured logging**: Logs in JSON formaat. Dit maakt analyse eenvoudiger.
- **Request logging**: Logt alle inkomende requests. Dit helpt met debugging en analytics.
- **Error logging**: Logt alle errors centraal. Dit helpt bij probleemoplossing.
- **Prisma logging**: Logt database queries en errors. Dit helpt bij performance tuning.
- **Request ID tracking**: Geeft elke request een unieke ID. Dit helpt bij tracing en debugging.

## Modules (herbruikbaar)

- **Health module**: Endpoint om status van app te controleren. Dit wordt gebruikt door monitoring tools.
- **Database health check**: Controleert database connectie status. Dit detecteert downtime.
- **Redis health check**: Controleert Redis status. Dit detecteert caching problemen.
- **Mail module**: Verstuurt emails vanuit je app. Dit wordt gebruikt voor notificaties en auth.
- **SMTP support**: Verstuurt emails via mail servers. Dit is standaard email protocol.
- **File module**: Beheert file uploads. Dit is nodig voor media handling.
- **S3 support**: Cloud storage voor files. Dit is schaalbaar en production ready.
- **Local file storage**: Opslag op lokale server. Dit is handig voor development.

## Performance & Background jobs

- **Redis module**: In-memory datastore voor caching en queues. Dit verhoogt performance.
- **Caching support**: Slaat tijdelijke data op. Dit vermindert database belasting.
- **Queues (`BullMQ`)**: Verwerkt taken op achtergrond. Dit voorkomt blocking operations.
- **Email queue**: Verstuurt emails async. Dit verhoogt performance.
- **Background jobs**: Voert zware taken async uit. Dit maakt app sneller.

## Developer experience

- **Scripts in `package.json`**: Automatiseren build, dev en database taken. Dit versnelt development.
- **ESLint**: Controleert code kwaliteit. Dit voorkomt fouten.
- **Prettier**: Formatteert code automatisch. Dit houdt code consistent.
- **Utils folder**: Bevat helper functies. Dit voorkomt duplicatie.
- **Shared folder**: Bevat gedeelde types en constants. Dit centraliseert code.
- **Constants folder**: Bevat vaste waarden. Dit voorkomt hardcoded waarden overal.
- **Types folder**: Bevat TypeScript types. Dit verhoogt type safety.

## Testing

- **Jest testing**: Framework voor unit tests. Dit test individuele onderdelen.
- **E2E testing**: Test complete API flows. Dit valideert systeem integratie.

## DevOps & Deployment

- **Docker**: Containeriseert je applicatie. Dit maakt deployment consistent.
- **Docker Compose**: Start meerdere services tegelijk. Dit vereenvoudigt development setup.
- **Postgres container**: Database container voor development en production. Dit maakt setup reproduceerbaar.
- **Redis container**: Redis container voor caching en queues. Dit maakt installatie eenvoudig.
- **Graceful shutdown**: Sluit app netjes af. Dit voorkomt data corruptie.
- **Centralized error handling**: Beheert alle errors op een plek. Dit maakt monitoring makkelijker.

## Advanced features

- **Feature flags**: Zet features aan of uit zonder deploy. Dit helpt bij testing en releases.

## Projectstructuur

```text
project-root/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── env.validation.ts
│   │   ├── database.config.ts
│   │   ├── auth.config.ts
│   │   ├── redis.config.ts
│   │   └── mail.config.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── base-response.dto.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── middleware/
│   │   │   └── request-id.middleware.ts
│   │   ├── utils/
│   │   │   ├── hash.util.ts
│   │   │   ├── date.util.ts
│   │   │   ├── pagination.util.ts
│   │   │   └── validator.util.ts
│   │   ├── constants/
│   │   │   ├── roles.constant.ts
│   │   │   ├── auth.constant.ts
│   │   │   └── app.constant.ts
│   │   └── types/
│   │       ├── request-with-user.type.ts
│   │       ├── jwt-payload.type.ts
│   │       └── pagination.type.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   ├── guards/
│   │   │   │   └── local-auth.guard.ts
│   │   │   └── strategies/
│   │   │       ├── jwt.strategy.ts
│   │   │       └── local.strategy.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   ├── health/
│   │   │   ├── health.module.ts
│   │   │   └── health.controller.ts
│   │   ├── mail/
│   │   │   ├── mail.module.ts
│   │   │   ├── mail.service.ts
│   │   │   └── templates/
│   │   │       ├── welcome.hbs
│   │   │       └── reset-password.hbs
│   │   ├── files/
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   └── storage/
│   │   │       ├── local.storage.ts
│   │   │       └── s3.storage.ts
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   └── queue/
│   │       ├── queue.module.ts
│   │       ├── queue.service.ts
│   │       └── processors/
│   │           └── mail.processor.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   ├── providers/
│   │   ├── logger.provider.ts
│   │   └── prisma.provider.ts
│   └── shared/
│       ├── enums/
│       │   ├── role.enum.ts
│       │   └── status.enum.ts
│       ├── interfaces/
│       │   ├── base-response.interface.ts
│       │   └── paginated-response.interface.ts
│       └── types/
│           └── global.types.ts
├── test/
│   ├── unit/
│   └── e2e/
│       ├── auth.e2e-spec.ts
│       └── users.e2e-spec.ts
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/
│   ├── seed.ts
│   └── create-admin.ts
├── .env
├── .env.development
├── .env.production
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
├── README.md
└── eslint.config.js
```
