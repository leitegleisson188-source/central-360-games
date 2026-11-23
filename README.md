# Central 360 Games

Portal gamer da Central 360: catálogo de Xbox 360 RGH, patches de futebol, jogos PC, mods, guias e tutoriais. O código é um site estático em português brasileiro e usa uma identidade visual própria, incluindo o emblema oficial da marca.

## Publicar com GitHub Pages (gratuito)

Este repositório é **público** e já tem o `index.html` na raiz.

1. Abra **Settings → Pages** neste repositório.
2. Em **Build and deployment → Source**, selecione **Deploy from a branch**.
3. Em **Branch**, selecione `main` e `/(root)`.
4. Clique em **Save**.
5. Confira o endereço publicado informado pelo GitHub Pages na mesma tela. O endereço habitual é:
   https://leitegleisson188-source.github.io/central-360-games/

**Nota:** o endereço acima é o esperado, não uma confirmação de que o deploy já terminou. Não é preciso pagar para usar Pages em repositório público com uma conta GitHub Free.

## Estrutura

- `index.html` — página inicial e estrutura do site.
- `assets/app.js` — catálogo, filtros, páginas, links e navegação.
- `assets/data.js` — registros demonstrativos do catálogo.
- `assets/style.css` — estilos responsivos.
- `assets/logo-central360.webp` — logotipo oficial otimizado.
- `robots.txt` — **solicita que mecanismos de busca não indexem esta prévia**, mas não torna o site privado.

## Conteúdo e manutenção

Todos os registros atuais são demonstrações. Não há links de download de jogos comerciais, nem checkout operacional. Para preencher o catálogo com conteúdo real, edite `assets/data.js` ou utilize o editor separado mantido na branch `site-central-360-games-preview` do repositório **privado** `central-360-arena`. Não publique o editor de catálogo neste site aberto.

Imagens, vídeos, downloads, descrições de compatibilidade e links comerciais só devem ser adicionados após conferência e autorização de uso. Depois do lançamento oficial, reavalie `robots.txt` para permitir a indexação nos buscadores.

Contato: central.360.comercial@gmail.com · Instagram: https://www.instagram.com/central__360/
