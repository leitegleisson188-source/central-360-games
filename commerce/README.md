# Central 360 Games — loja própria (MVP técnico)

O backend da loja fica em Cloudflare Workers, com banco Cloudflare D1, bucket privado Cloudflare R2 e Mercado Pago Payment Brick. O site público permanece no repositório, mas GitHub Pages não será usado como hospedagem comercial.

**Status: checkout e cobrança real DESATIVADOS. Nenhuma cobrança foi configurada ou executada.**

## O que já existe em código

- Vitrine de produtos licenciados, carrinho e formulário de e-mail.
- Criação de pedidos pelo servidor, com preços sempre calculados a partir do D1.
- Checkout Pix/cartão usando Payment Brick (os campos de cartão ficam sob os componentes do Mercado Pago).
- Webhook do Mercado Pago com validação HMAC, verificação do pagamento na API e comparação de valor, e-mail e pedido.
- Arquivos de produtos em bucket R2 privado, disponíveis somente após o pagamento aprovado.
- Revogação de downloads em casos de estorno, contestação e chargeback.
- Envio de e-mail com acesso ao pedido por Resend, sem compartilhar os arquivos do produto publicamente.
- Cobranças bloqueadas até configurar STORE_ENABLED=true com todas as credenciais.
- Vitrine demonstrativa sem cobranças na versão hospedada no GitHub Pages.

## Preparação para hospedagem própria

Requer contas sob controle da Central 360 na Cloudflare, Mercado Pago e provedor de e-mails; pode envolver tarifas de terceiros.

1. Na pasta commerce, executar npm install.
2. Criar D1: npx wrangler d1 create central360_store. Copiar o database_id retornado para wrangler.toml.
3. Criar R2 privado: npx wrangler r2 bucket create central360-private-deliveries. Não disponibilizar publicamente.
4. Aplicar tabelas: npx wrangler d1 execute central360_store --remote --file=./schema.sql.
5. Opcionalmente criar rascunhos desativados: npx wrangler d1 execute central360_store --remote --file=./catalogo-rascunho.sql.
6. Preencher a chave pública MP_PUBLIC_KEY e PUBLIC_ORIGIN (origem HTTPS final, sem barra no fim) no wrangler.toml.
7. Configurar segredos pelo comando npx wrangler secret put NOME, um de cada vez: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, DELIVERY_SECRET, RESEND_API_KEY, FROM_EMAIL.
8. Configurar no Mercado Pago o webhook de eventos de pagamento apontando para https://SEU-DOMINIO/api/webhooks/mercadopago.
9. Executar npm run build e npm run deploy na pasta commerce. O build copia somente index.html e os arquivos públicos da pasta assets para commerce/public. Código de backend e dados nunca são incluídos.
10. Conferir que /api/health apresenta setup_required enquanto as credenciais ou STORE_ENABLED estiverem pendentes.
11. Cadastrar produtos de propriedade autoral ou com direitos de distribuição comprovados, com preço, R2 asset_key e direitos marcados como verificados. Publicar apenas quando o arquivo existir e tiver sido testado.
12. Testar pagamentos sandbox, Pix pendente/aprovado, cartão recusado, webhook duplicado, email de entrega, download com token inválido, estorno e reembolso. **Ativar STORE_ENABLED=true somente após homologação.**

## Produtos iniciais

Os rascunhos contêm:
- PES 2021 PC — indisponível até validar autorização, arquivo e preço;
- PES 2021 Classic Patch 2006/2007 — indisponível até validar direitos de distribuição;
- Dragon Ball Budokai Tenkaichi 3 — indisponível até validar direitos;
- E-book IA do Seu Jeito — aguardando atualização editorial e arquivo definitivo.

Todos os rascunhos têm preço zero, sem arquivos e status desativado. Nenhum será cobrado automaticamente.
Um preço anterior proposto para o e-book era R$ 29,90, mas NÃO foi publicado nem confirmado como valor definitivo.

## Segurança e limitações

- A área administrativa visual ainda não foi implementada. A administração inicial será feita pelo banco via credenciais Cloudflare do proprietário; será necessário um painel com autenticação forte e trilha de auditoria.
- O MVP é somente para produtos digitais. HDs físicos exigem frete, estoque, endereço e política própria.
- Produtos comerciais de terceiros exigem licença apropriada: não basta haver o arquivo ou a capa.
- É proibido publicar qualquer token secreto, URL R2 privada, senha ou credencial no GitHub. Não enviar credenciais pelo chat.
- Rate limiting, prevenção adicional de fraude, LGPD, política de suporte/reembolso, termos de venda, teste de carga e monitoramento operacional precisam de revisão antes de ativar produção.
- Links de entrega são segredos de acesso. Downloads grandes com retomada (HTTP Range) ainda requerem melhorias.
- O e-mail depende de domínio/remetente aprovado no Resend; isso não foi configurado.
- GitHub Pages não permite hospedar como atividade principal uma operação comercial. A versão publicada permanece uma prévia editorial sem pagamentos até migrarmos.

## Fontes oficiais

Mercado Pago Payment Brick: https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/default-rendering

Mercado Pago Pix: https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/payment-submission/pix

Mercado Pago Webhooks: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications

Cloudflare Workers: https://developers.cloudflare.com/workers/static-assets/

Cloudflare D1: https://developers.cloudflare.com/d1/

Cloudflare R2: https://developers.cloudflare.com/r2/

GitHub Pages limites: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
