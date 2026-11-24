# Changelog

## 0.2.1 — 24/11/2026 · app instalável
- **Correção:** o site não era instalável. Faltavam o manifesto e o service worker, então o atalho no celular abria só como página comum e podia mostrar uma versão antiga por até 10 minutos (cache do GitHub Pages).
- `manifest.webmanifest` (nome, ícones do emblema, tela cheia, azul-marinho) e `sw.js` "rede primeiro", gerados a cada publicação com versão nova. Quem tem o app instalado recebe a atualização sozinho, e a página recarrega.
- O `kit/pwa.js` registra o `sw.js` da raiz em qualquer página (antes falhava em subpastas como `/servicos/mei/`).
- Link "📲 Instalar o app no celular" no rodapé, com instruções para Android, iPhone e computador.

## 0.2.0 — 24/11/2026 · protótipo alinhado ao prompt mestre
- O site passou a ter **16 páginas** com URLs amigáveis (`/servicos/mei/`, `/espaco-mei/`, `/fidelis-mei/` …), geradas a partir de `scripts/conteudo.mjs` com `scripts/gerar-site.mjs`.
- Menu com os 10 itens do prompt; abertura com "Segurança para o seu negócio. Confiança para o seu futuro." e 3 botões; bloco "Do que você precisa?" com 8 opções.
- Serviços reorganizados pelo prompt (MEI, empresariais, Imposto de Renda, trabalhista), com situação ativo / sob consulta / futuro.
- Páginas de Espaço MEI (com links oficiais conferidos), FIDELIS MEI (em desenvolvimento, sem preços), Ferramentas (em breve), Conteúdos, Área do cliente, Contato, Privacidade e Termos (minutas).
- **Removidos todos os dados inventados** (e-mail, Instagram, telefone, endereço, mapa, "igrejas", prazos de resposta). Aparecem como "a definir".
- Paleta do prompt como tokens; texto dourado só em fundo escuro.
- Formulário de proposta com consentimento (LGPD) e prévia do pedido enquanto não há WhatsApp oficial.
- Testes do kit: todas as páginas abrem, links das necessidades, serviços por grupo, **varredura de dados inventados**, app sem preço, links oficiais, formulário.
- Documentos da Fase 0 em `docs/`. Servidor PHP do kit removido (o backend será Python).

## 0.1.0 — 24/11/2026 · primeiro protótipo
- Site de uma página feito antes de receber o prompt mestre (substituído pela 0.2.0).
