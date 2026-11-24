# FIDELIS — Contabilidade & Consultoria

Site institucional (protótipo para aprovação) com a barra amarela de sugestões e testes.

- **Protótipo no ar:** https://wesleysimone.github.io/fidelis-site/
- **Repositório:** https://github.com/wesleysimone/fidelis-site
- **Versão atual:** 0.1.0 (ver `documentacao/ROTEIRO.md`)

## Como rodar no computador
```bash
python -m http.server 5173 --directory site
```
Abra http://localhost:5173. Para testar a API de sugestões compartilhada: `npm install` e depois `npm run local`.

## Pastas
| Pasta | O que tem |
|---|---|
| `site/` | o que vai no link (HTML, `estilo.css`, `app.js`, `assets/` com logo tratado e ícones, `kit/` da barra de protótipo) |
| `servidor/` | API PHP + MySQL das sugestões (vai para a hospedagem quando houver) |
| `documentacao/` | análise, roteiro de versões e mensagens prontas |
| `material-cliente/` | arquivos originais do cliente (fora do Git) |

## Documentos
- [Análise do cliente](documentacao/ANALISE.md)
- [Roteiro de versões](documentacao/ROTEIRO.md)
- [Mensagem para o cliente](documentacao/MENSAGEM-CLIENTE.md)
- [Mensagem para o grupo de testes](documentacao/MENSAGEM-GRUPO-TESTES.md)

## Dados fictícios
WhatsApp, telefone, endereço, CNPJ e CRC são de exemplo e ficam em `site/app.js` (objeto `FIDELIS`) e no `site/index.html`. Trocar quando o cliente definir.

## Versão final
Remover as tags do kit no fim do `index.html` e o `<meta name="robots" content="noindex">`.
