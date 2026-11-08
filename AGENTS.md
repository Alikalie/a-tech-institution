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

- Applicant AI verification uses an authenticated raw streaming route with server-validated super-admin roles and application-owned evidence; it never changes admission decisions.
- AI Gateway providers and prompts live in server-only modules, use request-scoped run IDs, and disable automatic retries to prevent replaying terminal failures.
- Provider access-denial state is durable in site settings; resumption requires a super administrator's explicit new review after access restoration.
