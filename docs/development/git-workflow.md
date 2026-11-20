# Commits

Mensagem no formato Conventional Commits: `tipo(escopo): descrição`.

Tipos usados aqui: `feat`, `fix`, `docs`, `test`, `chore`.

O hook `commit-msg` recusa mensagem fora desse formato. O `pre-commit` roda `biome check --staged`.
