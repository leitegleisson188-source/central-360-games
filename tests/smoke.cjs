"use strict";

/**
 * Testes sem dependências do protótipo Central 360 Games.
 * Execução: node --test tests/smoke.cjs
 * Não substitui uma validação visual em navegador real.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = {
  html: fs.readFileSync(path.join(root, "index.html"), "utf8"),
  css: fs.readFileSync(path.join(root, "assets/style.css"), "utf8"),
  data: fs.readFileSync(path.join(root, "assets/data.js"), "utf8"),
  videos: fs.readFileSync(path.join(root, "assets/videos.js"), "utf8"),
  library: fs.readFileSync(path.join(root, "assets/biblioteca.js"), "utf8"),
  app: fs.readFileSync(path.join(root, "assets/app.js"), "utf8"),
};

function boot(hash = "#/", mutate) {
  const elements = new Map();
  const get = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: "",
        value: "",
        textContent: "",
        hidden: false,
        classList: { toggle() {} },
        addEventListener() {},
        setAttribute() {},
        getAttribute() { return null; },
        querySelector() { return { focus() {}, value: "" }; },
        click() {},
      });
    }
    return elements.get(id);
  };
  const document = { getElementById: get, querySelectorAll() { return []; }, title: "" };
  const location = { hash, pathname: "/central-360-games/", search: "" };
  const window = { location, addEventListener() {}, scrollTo() {} };
  const history = {
    replaceState(_state, _title, url) {
      const idx = String(url).indexOf("#");
      if (idx >= 0) location.hash = String(url).slice(idx);
    },
  };
  const context = vm.createContext({
    document, location, window, history, URL, URLSearchParams,
    encodeURIComponent, decodeURIComponent, console,
  });
  vm.runInContext(source.data, context, { filename: "data.js" });
  vm.runInContext(source.videos, context, { filename: "videos.js" });
  if (mutate) mutate(window.C360_GAMES, window.C360_VIDEOS);
  vm.runInContext(source.library, context, { filename: "biblioteca.js" });
  vm.runInContext(source.app, context, { filename: "app.js" });
  return {
    window, document,
    html: get("app").innerHTML,
    grid: get("result-grid").innerHTML,
    status: get("result-count").innerHTML,
    get,
  };
}

test("arquivos essenciais e identidade do portal presentes", () => {
  assert.match(source.html, /<html lang="pt-BR">/);
  assert.match(source.html, /<main|id="app"/);
  for (const asset of ["./assets/style.css", "./assets/data.js", "./assets/videos.js", "./assets/biblioteca.js", "./assets/app.js", "./assets/logo-central360.webp"]) {
    assert.ok(source.html.includes(asset), "referência ausente: " + asset);
  }
  for (const file of ["assets/logo-central360.webp", "README.md"]) {
    assert.ok(fs.statSync(path.join(root, file)).isFile(), "arquivo ausente: " + file);
  }
  assert.ok(source.css.includes("@media"), "faltam estilos responsivos");
  assert.equal(fs.existsSync(path.join(root, "editor.html")), false, "editor interno não deve ser publicado");
});

test("catálogo demonstrativo tem slugs únicos e campos principais", () => {
  const { window } = boot();
  const items = window.C360_GAMES;
  assert.ok(items.length >= 12);
  assert.equal(new Set(items.map(g => g.slug)).size, items.length);
  for (const item of items) {
    assert.match(item.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const key of ["title", "platform", "type", "genre", "language", "description", "short", "featured"]) {
      assert.ok(typeof item[key] === "string" && item[key].trim(), item.slug + ": falta " + key);
    }
    assert.ok(Array.isArray(item.tone) && item.tone.length === 2, item.slug + ": cores inválidas");
    assert.ok(item.tone.every(color => /^#[0-9a-fA-F]{6}$/.test(color)), item.slug + ": formato das cores");
  }
});

test("homepage exibe destaques e caminho para o catálogo", () => {
  const page = boot("#/");
  assert.match(page.html, /O SEU PRÓXIMO/);
  assert.match(page.html, /#\/todos-os-games/);
  assert.match(page.html, /PES 2021 Classic Patch 2006\/2007/);
});

test("catálogo renderiza busca, filtros e resultados", () => {
  const page = boot("#/todos-os-games");
  assert.match(page.html, /id="catalog-query"/);
  assert.match(page.html, /id="platform-filter"/);
  assert.match(page.html, /id="genre-filter"/);
  assert.match(page.grid, /class="game-card"/);
  assert.match(page.status, /resultados encontrados/);
  assert.match(page.get("alphabet").innerHTML, /data-letter="A"/);
});

test("filtro por tipo Patch mostra somente patches", () => {
  const page = boot("#/todos-os-games?tipo=Patch");
  assert.match(page.grid, /PES 2021 Classic Patch/);
  assert.doesNotMatch(page.grid, /Halo 3/);
  assert.equal(page.get("type-filter").value, "Patch");
});

test("página individual do game abre com ficha técnica", () => {
  const page = boot("#/jogo/pes-2021-classic-patch-2006-2007");
  assert.match(page.html, /PES 2021 Classic Patch/);
  assert.match(page.html, /Informações/);
  assert.match(page.html, /Orientações e compatibilidade/);
  assert.match(page.html, /não existe link|Não existe link/i);
});

test("páginas institucionais não ficam vazias", () => {
  for (const [route, expected] of [
    ["#/tutoriais", "Tutoriais e Guias"],
    ["#/loja", "Loja Central 360"],
    ["#/sobre", "Sobre a Central 360"],
  ]) {
    assert.match(boot(route).html, new RegExp(expected), route);
  }
});

test("conteúdo de título é escapado no HTML", () => {
  const page = boot("#/jogo/pes-2021-classic-patch-2006-2007", items => {
    items[0].title = '<img src=x onerror=alert(1)>';
  });
  assert.doesNotMatch(page.html, /<img src=x onerror/);
  assert.match(page.html, /&lt;img src=x/);
});

test("URLs de mídia inseguras são descartadas", () => {
  const page = boot("#/jogo/pes-2021-classic-patch-2006-2007", items => {
    items[0].coverImage = "javascript:alert(1)";
    items[0].screenshots = "javascript:alert(2)\nhttps://example.org/licenciada.webp";
    items[0].videoUrl = "https://example.org/watch?v=ABCDEFGHIJK";
  });
  assert.doesNotMatch(page.html, /javascript:alert/);
  assert.match(page.html, /https:\/\/example.org\/licenciada.webp/);
  assert.doesNotMatch(page.html, /youtube-nocookie/);
});

test("URL válida do YouTube gera incorporação sem cookies", () => {
  const page = boot("#/jogo/pes-2021-classic-patch-2006-2007", items => {
    items[0].videoUrl = "https://www.youtube.com/watch?v=ABCDEFGHIJK";
  });
  assert.match(page.html, /youtube-nocookie.com\/embed\/ABCDEFGHIJK/);
});


test("canal Central 360 e 16 vídeos oficiais estão cadastrados", () => {
  const { window } = boot();
  assert.equal(window.C360_CHANNEL.id, "UCoU4Fib0QanopKfzGUJ_nMQ");
  assert.equal(window.C360_CHANNEL.handle, "@central_360");
  const videos = window.C360_VIDEOS;
  assert.ok(videos.length >= 15);
  assert.equal(new Set(videos.map(v => v.id)).size, videos.length);
  for (const video of videos) {
    assert.match(video.id, /^[\w-]{11}$/);
    assert.ok(video.title && video.description && video.category);
    assert.match(video.duration, /^\d+:\d\d$/);
  }
});

test("biblioteca abre com filtros, miniaturas e link direto para o YouTube", () => {
  const page = boot("#/biblioteca");
  assert.match(page.html, /UMA BIBLIOTECA PARA/);
  assert.match(page.html, /id="video-query"/);
  assert.match(page.html, /#video-results/);
  assert.match(page.get("video-grid").innerHTML, /youtube\.com\/watch\?v=MS5vz6Cgo80/);
  assert.match(page.get("video-grid").innerHTML, /i\.ytimg\.com\/vi\/MS5vz6Cgo80/);
  assert.match(page.get("video-grid").innerHTML, /target="_blank" rel="noopener noreferrer"/);
  assert.match(page.get("video-categories").innerHTML, /Aurora/);
  assert.match(page.get("video-count").textContent, /vídeos encontrados/);
});

test("biblioteca filtra por tema e pesquisa na URL", () => {
  const page = boot("#/biblioteca?categoria=Aurora&q=configurar");
  assert.match(page.get("video-grid").innerHTML, /Aurora no Xbox 360 RGH/);
  assert.doesNotMatch(page.get("video-grid").innerHTML, /FC 26 no Xbox 360/);
  assert.equal(page.get("video-query").value, "configurar");
  assert.match(page.window.location.hash, /categoria=Aurora/);
});

test("pesquisa vazia apresenta um estado de nenhum resultado", () => {
  const page = boot("#/biblioteca?q=palavra-inexistente-123456");
  assert.match(page.get("video-grid").innerHTML, /Nenhum vídeo encontrado/);
});

test("home e tutoriais divulgam vídeos reais do canal", () => {
  const home = boot("#/");
  const tutorial = boot("#/tutoriais");
  assert.match(home.html, /Nossa biblioteca de vídeos/);
  assert.match(home.html, /youtube\.com\/watch\?v=/);
  assert.match(tutorial.html, /Tutoriais em vídeo/);
});
