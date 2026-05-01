---
name: create-shadcn-mail-template
description: Creates or refactors Handlebars email templates in a consistent shadcn-inspired style using email-safe inline CSS. Use when working on files in src/modules/mail/templates, when creating new mail templates, or when the user asks for modern/consistent email design.
---

# Create Shadcn Mail Template

## When to use

Use this skill when you:

- create a new mail template in `src/modules/mail/templates/*.hbs`;
- restyle an existing mail template;
- want consistent, modern styling in a shadcn vibe.

## Non-negotiables

- Use only email-safe HTML + inline CSS.
- Do not use Tailwind classes or any external stylesheet.
- Keep existing Handlebars placeholders intact (`{{name}}`, `{{code}}`, `{{temporaryPassword}}`, `{{password}}`, etc.).
- Keep template logic minimal; only simple placeholders.

## Design baseline

Use this as the standard visual language:

- Background: light, neutral tint (e.g. `#f8fafc`).
- Centred card container with `max-width` around `560px`.
- White card with a subtle border (`#e2e8f0`) and radius (`10-12px`).
- Clear hierarchy:
  - small uppercase label;
  - strong heading;
  - calm body copy (`14-15px`).
- Consistent vertical spacing and a footer with a divider.

## Component patterns

Apply these patterns based on content:

1. **Code block (activation)**
   - Monospace font, increased letter spacing, center aligned.
   - Light panel with a border or dashed border.

2. **Sensitive secret block (temporary password)**
   - Separate panel with title + monospace secret value.
   - Add a warning/notice that the user must change it immediately.

3. **Security alert block**
   - Contrasting warning tint (e.g. soft red/orange).
   - Short, clear call-out for suspicious actions.

4. **Welcome/neutral content**
   - No hard alert, but consistent hero + body + footer.

## Accessibility and compatibility

- Keep text contrast high enough.
- Use tables as the layout wrapper for broad email-client support.
- Avoid modern CSS features with poor email-client support.
- Keep the width mobile-friendly with full width and a max-width card.

## Workflow checklist

Use and update this checklist while making changes:

- [ ] Template lives in `src/modules/mail/templates/*.hbs`.
- [ ] Inline CSS only.
- [ ] Shadcn-inspired card/layout applied.
- [ ] Correct component pattern used (code/secret/alert/welcome).
- [ ] Placeholders and context keys preserved.
- [ ] Footer/divider added.
- [ ] Template compiles as Handlebars without extra helpers.

## Validation

After changes:

1. Compile templates with Handlebars and a sample context.
2. Check diagnostics/lints on the modified files.
3. Do not change the `MailService` rendering flow unless explicitly requested.

## Related project conventions

- `.claude/rules/mail-templates.mdc`
