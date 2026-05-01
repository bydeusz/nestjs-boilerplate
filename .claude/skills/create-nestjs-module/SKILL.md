---
name: create-nestjs-module
description: Scaffolds a complete NestJS feature module in this boilerplate, including prisma fragment, DTOs, service, controller, and module wiring. Use when adding a new feature module, CRUD resource, or domain module in src/modules.
---

# Create NestJS Module

## When to use

Use this skill when a new module/resource needs to be added in `src/modules`.

## Workflow

1. **Create the module structure**
   - Create `src/modules/<name>/` containing:
     - `<name>.module.ts`
     - `<name>.controller.ts`
     - `<name>.service.ts`
     - `<name>.prisma`
     - `dto/` folder with `index.ts`

2. **Create the Prisma fragment**
   - Add models/enums in `src/modules/<name>/<name>.prisma`.
   - Keep the root `schema.prisma` limited to generator + datasource.

3. **Create DTOs**
   - Request DTOs: `Create*Dto`, `Update*Dto`, `*QueryDto` with validators.
   - Response DTO: `*ResponseDto`, without validators.
   - Use Swagger decorators on request DTOs.

4. **Create the service**
   - Define a `*PublicSelect` constant + typed payload alias.
   - Add CRUD methods.
   - Add pagination helpers for list endpoints.
   - Add mapping via `to*ResponseDto()`.
   - Add cache invalidation after mutations when cache is used.

5. **Create the controller**
   - Add `@Controller`, `@ApiTags`, `@ApiBearerAuth`.
   - Use `@Roles`, `@CurrentUser`, `@Public` where needed.
   - Use `ParseUUIDPipe` for UUID params.
   - Delegate business logic to the service.

6. **Wire up the module**
   - Register imports/providers/controllers/exports in `<name>.module.ts`.
   - Use `QueueModule.register('producer')` if jobs are enqueued.

7. **Register the module**
   - Import the new module in `AppModule` or `WorkerModule` where needed.

8. **Validate Prisma**
   - Run:
     - `npx prisma validate`
     - `npx prisma generate`
     - `npx prisma migrate dev` (only on a schema change)

9. **Check consistency**
   - Keep naming consistent (`Create*Dto`, `*ResponseDto`, etc.).
   - Add barrel exports in `dto/index.ts` and the module `index.ts`.

## Related project rules

- `.claude/rules/nestjs-module-structure.mdc`
- `.claude/rules/dto-conventions.mdc`
- `.claude/rules/service-layer-pattern.mdc`
- `.claude/rules/controller-conventions.mdc`
- `.claude/rules/prisma-modular-schema.mdc`
- `.claude/rules/queue-worker.mdc`
