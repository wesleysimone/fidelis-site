# FIDELIS — Contabilidade & Consultoria · protótipo do site

Protótipo visual para aprovação (sem dados reais), com a barra amarela de sugestões e testes.

- **No ar:** https://wesleysimone.github.io/fidelis-site/
- **Versão:** 0.2.0 (ver `CHANGELOG.md`)

## Como editar e ver no computador
1. Edite o conteúdo em `scripts/conteudo.mjs` (dados da empresa, menu, serviços, ferramentas, dúvidas).
2. Gere as páginas: `node scripts/gerar-site.mjs`
3. Veja no navegador: `python -m http.server 5173 --directory site` → http://localhost:5173

Campos vazios em `conteudo.mjs` aparecem no site como **"a definir"**. Nunca preencha com dados inventados.

## Pastas
| Pasta | O que tem |
|---|---|
| `site/` | o que vai no link: páginas geradas, `estilo.css` (tokens de design), `app.js`, `assets/`, `kit/` |
| `scripts/` | conteúdo central e gerador das páginas |
| `docs/` | documentos internos da Fase 0 — **não versionados neste repositório público** |
| `material-cliente/` | arquivos originais do cliente (fora do Git) |

## Versão final
O protótipo será substituído pelo site da Fase 2 (FastAPI + Jinja2) no repositório privado da plataforma.
