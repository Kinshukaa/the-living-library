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

- Keep reading status independent from physical placement (`items.placement`); opening or completing a book must not implicitly move it to the floor pile.
- Store genre choices and cat naming per reader in profiles, and persist shelf arrangement through item sort_order; personal curation must survive reloads.
