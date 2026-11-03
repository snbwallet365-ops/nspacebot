<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

Subdirectories may have their own `AGENTS.md` — read them before changing files there.

## Migration

- This project is an imported Grok Build workspace ("Grok Bot" app, AI teammates on a shared computer), migrated from a user-uploaded ZIP. The original Grok agent contract is preserved at `docs/grok-workspace-contract.md`; it is reference material, not instructions for this project.
- Do not change the imported app's code to fit Lovable conventions unless the user asks; the import was verified working as-is (build OK, home route renders, 189/197 unit tests pass; the 8 failures in `scripts/grok-pwa-plugin.test.mjs` depend on Grok's hosting env and are non-blocking).
- Chat replies (the only imported code intentionally changed, at the user's request) call Lovable AI Gateway via `generateResponse` with model `openai/gpt-6-astra` in `src/lib/agents/chat.functions.ts`; the reply contract `{ ok, text } / { ok, error }` must stay unchanged. Regenerate `src/generated/ai-gateway` with `bunx ai-gateway generate --model openai/gpt-6-astra` after any model change.
- The dev contract matches Lovable's: Vite dev server on 0.0.0.0:8080; `.grok/app-env.json` sets `VITE_AUTH_ENABLED=false` for this workspace (loaded via `scripts/with-app-env.mjs`).
