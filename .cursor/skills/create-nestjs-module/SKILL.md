---
name: create-nestjs-module
description: Scaffolds a complete NestJS feature module in this boilerplate, including prisma fragment, DTOs, service, controller, and module wiring. Use when adding a new feature module, CRUD resource, or domain module in src/modules.
---

# Create NestJS Module

## When to use

Gebruik deze skill als een nieuwe module/resource toegevoegd moet worden in `src/modules`.

## Workflow

1. **Maak module structuur**
   - Maak `src/modules/<name>/` met:
     - `<name>.module.ts`
     - `<name>.controller.ts`
     - `<name>.service.ts`
     - `<name>.prisma`
     - `dto/` map met `index.ts`

2. **Maak Prisma fragment**
   - Voeg model/enums toe in `src/modules/<name>/<name>.prisma`.
   - Houd root `schema.prisma` beperkt tot generator + datasource.

3. **Maak DTOs**
   - Request DTOs: `Create*Dto`, `Update*Dto`, `*QueryDto` met validators.
   - Response DTO: `*ResponseDto`, zonder validators.
   - Gebruik swagger decorators op request DTOs.

4. **Maak service**
   - Definieer `*PublicSelect` + typed payload alias.
   - Voeg CRUD methods toe.
   - Voeg paginatie helpers toe voor list endpoints.
   - Voeg mapping toe via `to*ResponseDto()`.
   - Voeg cache invalidatie toe na mutaties als cache gebruikt wordt.

5. **Maak controller**
   - Voeg `@Controller`, `@ApiTags`, `@ApiBearerAuth` toe.
   - Gebruik `@Roles`, `@CurrentUser`, `@Public` waar nodig.
   - Gebruik `ParseUUIDPipe` voor UUID params.
   - Delegeer business logic naar service.

6. **Maak module wiring**
   - Registreer imports/providers/controllers/exports in `<name>.module.ts`.
   - Gebruik `QueueModule.register('producer')` als jobs worden gequeued.

7. **Registreer module**
   - Importeer nieuwe module in `AppModule` of `WorkerModule` waar nodig.

8. **Valideer Prisma**
   - Draai:
     - `npx prisma validate`
     - `npx prisma generate`
     - `npx prisma migrate dev` (alleen bij schemawijziging)

9. **Check consistentie**
   - Houd naming consistent (`Create*Dto`, `*ResponseDto`, etc.).
   - Voeg barrel exports toe in `dto/index.ts` en module `index.ts`.

## Related project rules

- `.cursor/rules/nestjs-module-structure.mdc`
- `.cursor/rules/dto-conventions.mdc`
- `.cursor/rules/service-layer-pattern.mdc`
- `.cursor/rules/controller-conventions.mdc`
- `.cursor/rules/prisma-modular-schema.mdc`
- `.cursor/rules/queue-worker.mdc`
