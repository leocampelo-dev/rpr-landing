# Landing page RPR Recupera Pisos & Revestimentos

HTML, CSS e JavaScript puros. Sem build, sem dependências, sem internet para rodar (fontes e ícones já estão no projeto).

## Como abrir no VS Code
1. Abra a pasta `rpr-landing` no VS Code.
2. Instale a extensão **Live Server** (Ritwick Dey).
3. Clique com o botão direito em `index.html` > **Open with Live Server**.

## Estrutura
- `index.html`: as 11 dobras, o header, o rodapé, o botão flutuante e os dados estruturados (LocalBusiness e FAQ).
- `css/styles.css`: design system (variáveis no topo, em `:root`), componentes e cada dobra, numerados.
- `js/main.js`: animação de entrada, slider antes/depois, carrosséis, rastreamento do WhatsApp.
- `assets/img/`: imagens. `assets/fonts/`: Archivo Black e DM Sans. 

## O que falta você trocar (nesta ordem)
1. **Fotos reais**: os 31 arquivos `.jpg` de `assets/img/` são provisórios (cinza com o nome escrito). Salve a foto real **com o mesmo nome** por cima. Proporções: `hero-*`, `troca-*` e `como-funciona-*` em 4:5; `servico-*` em 16:9; `resultado-*` e `atende-*` em 4:3; fundos em 16:9. Exporte em WebP/JPG leve (até 150 KB cada nos resultados).
   - Se mudar para `.webp`, troque a extensão no `index.html`.
   - Regra: o antes e o depois de cada par precisam ter o mesmo enquadramento e luz, e sem filtro.
2. **Logo**: `assets/img/logo-rpr.svg` é provisório. Troque pelo vetor oficial (versão clara #EBEBEB).
3. **Legendas dos 8 pares** da dobra 4: procure `Tipo de piso · Serviço realizado` no `index.html` e escreva o piso e o serviço reais de cada obra.
4. **Link das avaliações do Google** (dobra 7): procure `TODO` no `index.html` e coloque o link direto do Perfil.
5. **FAQ**: faltam 4 respostas da Sheila (móveis, apartamento, duração do resultado, piso sem recuperação). Estão em comentário `TODO` na dobra 10. Quando chegarem, adicione no HTML **e** no JSON-LD do `<head>`.
6. **Domínio**: `recuperapisosrpr.com` está no canonical, no Open Graph, no `robots.txt` e no `sitemap.xml`. Confira se é o endereço final.

## Medição (Google Ads)
Cada botão de WhatsApp envia `whatsapp_click` para o `dataLayer`, com o atributo `cta_location` (hero, troca, resultados, flutuante...). No Google Tag Manager, crie um acionador de evento personalizado `whatsapp_click` e use como conversão no Google Ads. Cole o código do GTM no `<head>` (há um comentário marcando o lugar).

## Publicar
Qualquer hospedagem estática serve (Vercel, Netlify, Cloudflare Pages, Hostinger). Suba a pasta inteira. Depois:
1. Ligue o domínio no Perfil da Empresa no Google (substitui a descrição antiga do site).
2. Peça a indexação da página no Google Search Console.

## Pendências de copy (do documento de copy)
- Confirmar com a Sheila: equipe uniformizada, serviço sem parar a rotina, atendimento em apartamentos.
- Textos novos que o Leo precisa aprovar: rótulos acima dos títulos (Serviços, Resultados, Avaliações...), mensagem pré-preenchida do WhatsApp e botão "WhatsApp" do header.
