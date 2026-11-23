-- Somente PLANEJAMENTO. Nenhum item abaixo é publicado ou vendido.
-- Preencher preço, licença de comercialização, arquivo autorizado em R2 e
-- marcar rights_verified=1 e active=1 SOMENTE após conferência manual.
INSERT OR IGNORE INTO products
(id,title,description,category,price_cents,image,asset_key,download_name,active,rights_verified)
VALUES
('ia-do-seu-jeito','IA do Seu Jeito — e-book','Edição revisada em preparação. Livro autoral de IA, conteúdo e negócios.','E-book',0,'./assets/art-tutoriais.svg','','IA_do_Seu_Jeito.pdf',0,0),
('pes-2021-pc','PES 2021 PC','Produto em revisão de autorização e de método de entrega.','Jogos PC',0,'./assets/art-patch-classico.svg','','material.zip',0,0),
('pes-classic-2006-2007','PES 2021 Classic Patch 2006/2007','Patch demonstrado no canal. Venda depende de direitos de distribuição.','Patches',0,'./assets/art-patch-classico.svg','','material.zip',0,0),
('dragon-ball-bt3','Dragon Ball Budokai Tenkaichi 3','Produto solicitado; venda digital depende de autorização e arquivo licenciado.','Jogos',0,'./assets/art-xbox-biblioteca.svg','','material.zip',0,0);
