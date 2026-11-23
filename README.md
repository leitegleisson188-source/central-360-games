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


## Biblioteca de vídeos do canal Central 360

A seção [Biblioteca de Vídeos](https://leitegleisson188-source.github.io/central-360-games/#/biblioteca) organiza vídeos do canal oficial [Central 360 (@central_360)](https://www.youtube.com/@central_360), incluindo tutoriais de Aurora, desbloqueio do Xbox 360, kernel, instalação de patches com Horizon, HD externo e jogos online.

- `assets/videos.js`: lista curada de vídeos com ID do YouTube, título, resumo editorial, categoria, duração e tags.
- `assets/biblioteca.js`: renderização da biblioteca, pesquisa, categorias, ordenação e cards.
- `assets/style.css`: visual gamer e cards com thumbnails oficiais de vídeos hospedados no YouTube.

A biblioteca mostra miniaturas do YouTube a partir dos IDs verificados e envia o visitante ao vídeo original ao clicar em **Assistir**. **Nenhum vídeo é copiado ou hospedado no GitHub Pages.** Os resumos são próprios; links e títulos devem ser verificados antes de novas inserções.

Para adicionar vídeos, acrescente um novo registro em `window.C360_VIDEOS` dentro de `assets/videos.js`. Use o ID de 11 caracteres do vídeo real, em vez de inventar links. As categorias existentes podem ser expandidas sem alterar o layout.

## Conteúdo e manutenção

Todos os registros atuais são demonstrações. Não há links de download de jogos comerciais, nem checkout operacional. Para preencher o catálogo com conteúdo real, edite `assets/data.js` ou utilize o editor separado mantido na branch `site-central-360-games-preview` do repositório **privado** `central-360-arena`. Não publique o editor de catálogo neste site aberto.

Imagens, vídeos, downloads, descrições de compatibilidade e links comerciais só devem ser adicionados após conferência e autorização de uso. Depois do lançamento oficial, reavalie `robots.txt` para permitir a indexação nos buscadores.

Contato: central.360.comercial@gmail.com · Instagram: https://www.instagram.com/central__360/

## Acervo histórico e guias por ferramenta

A biblioteca foi ampliada para **39 vídeos públicos verificados da Central 360**, incluindo **23 vídeos antigos** publicados entre 2024 e 2026. A área de acervo tem endereço `#/biblioteca/acervo`.

Foram criadas páginas dedicadas com navegação própria:

- `#/biblioteca/aurora` — configuração e atualização do Aurora.
- `#/biblioteca/horizon` — Horizon, arquivos e patches.
- `#/biblioteca/dashlaunch` — informações gerais e links relacionados (**não há vídeo específico confirmado**).
- `#/biblioteca/kernel` — kernel 17559 e manutenção do console.
- `#/biblioteca/hd-externo` — armazenamento e pendrives.
- `#/biblioteca/desbloqueio` — métodos e cuidados.
- `#/biblioteca/jogar-online` — multiplayer e servidores.
- `#/biblioteca/patches` — Bomba Patch e patches clássicos.
- `#/biblioteca/mods` — modificações e personalizações.

Todos os links levam ao vídeo original no YouTube, sem re-hospedar conteúdo. As páginas têm notas introdutórias e recomendações de cuidado; **não substituem as instruções completas dos vídeos nem garantem compatibilidade de ferramentas**.

### Para atualizar

1. Acrescente apenas **IDs de vídeos confirmados como públicos do canal** em `assets/videos.js` (campo `window.C360_VIDEOS`).
2. Evite repetir IDs. Para vídeos antigos, indique `archive: true` e `publishedAt: "AAAA-MM-DD"`.
3. Associe os IDs à página temática em `window.C360_TOPICS` sem incluir vídeos de outros canais por engano.
4. Execute `node --test tests/smoke.cjs` e revise as alterações na branch antes de publicar.
5. A seção é estática: a inclusão de novos vídeos exige atualização do arquivo; não há acesso automático à conta do YouTube pela página.

**Observação:** o arquivo `robots.txt` da fase de prévia ainda desestimula indexação; avaliar sua remoção e a revisão de todo o conteúdo antes do lançamento público definitivo.
