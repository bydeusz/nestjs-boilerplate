---
name: create-shadcn-mail-template
description: Creates or refactors Handlebars email templates in a consistent shadcn-inspired style using email-safe inline CSS. Use when working on files in src/modules/mail/templates, when creating new mail templates, or when the user asks for modern/consistent email design.
---

# Create Shadcn Mail Template

## When to use

Gebruik deze skill wanneer je:

- een nieuwe mail template maakt in `src/modules/mail/templates/*.hbs`;
- een bestaande mail template restylet;
- consistente, moderne styling wilt in shadcn-sfeer.

## Non-negotiables

- Gebruik alleen e-mailveilige HTML + inline CSS.
- Gebruik geen Tailwind classes of externe stylesheet.
- Houd bestaande Handlebars placeholders intact (`{{name}}`, `{{code}}`, `{{temporaryPassword}}`, `{{password}}`, etc.).
- Houd template logic minimaal; alleen simpele placeholders.

## Design baseline

Gebruik dit als standaard visual language:

- Achtergrond: lichte, neutrale tint (bijv. `#f8fafc`).
- Gecentreerde card container met `max-width` rond `560px`.
- Witte card met subtiele border (`#e2e8f0`) en radius (`10-12px`).
- Duidelijke hiërarchie:
  - kleine uppercase label;
  - krachtige heading;
  - rustige body copy (`14-15px`).
- Consistente verticale spacing en footer met divider.

## Component patterns

Pas deze patronen toe op basis van inhoud:

1. **Code block (activation)**
   - Monospace font, hogere letter spacing, center aligned.
   - Licht vlak met border/dashed border.

2. **Sensitive secret block (temporary password)**
   - Aparte panel met titel + monospace secret value.
   - Voeg warning/notice toe dat gebruiker direct moet wijzigen.

3. **Security alert block**
   - Contrasterende waarschuwingstint (bijv. soft red/orange).
   - Korte, duidelijke call-out voor verdachte acties.

4. **Welcome/neutral content**
   - Geen hard alert, wel consistente hero + body + footer.

## Accessibility and compatibility

- Houd tekstcontrast hoog genoeg.
- Gebruik tabellen als layout-wrapper voor brede e-mailclient ondersteuning.
- Vermijd moderne CSS features met slechte e-mailclient support.
- Houd breedte mobielvriendelijk met volledige breedte en max-width card.

## Workflow checklist

Gebruik en update deze checklist tijdens wijzigingen:

- [ ] Template staat in `src/modules/mail/templates/*.hbs`.
- [ ] Inline CSS only.
- [ ] Shadcn-geinspireerde card/layout toegepast.
- [ ] Correcte component pattern gebruikt (code/secret/alert/welcome).
- [ ] Placeholders en context keys intact gebleven.
- [ ] Footer/divider toegevoegd.
- [ ] Template compileert als Handlebars zonder extra helpers.

## Validation

Na wijzigingen:

1. Compileer templates met Handlebars en een sample context.
2. Check diagnostics/lints op aangepaste bestanden.
3. Wijzig geen `MailService` rendering flow, tenzij expliciet gevraagd.

## Related project conventions

- `.cursor/rules/mail-templates.mdc`
