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
- `css/effects.css` + `js/effects.js`: camada de movimento (fundo que limpa com a politriz, barra de progresso). É uma camada extra: se os dois arquivos e as duas linhas deles no `index.html` forem removidos, a página continua funcionando.
- `assets/img/`: imagens. `assets/fonts/`: Archivo Black e DM Sans. 

## Efeitos de movimento
Só dois, de propósito (visual limpo):
- **Fundo que limpa, com o mouse virando uma politriz** (dobra 1 e CTA final): `data-clean` na `<section>` mais um `<canvas class="clean-canvas">` logo depois da imagem de fundo. A "sujeira" é gerada pelo código a partir da própria foto (mais leve quando a foto é clara). O cursor vira a politriz da imagem em `data-tool="assets/img/politriz.webp"` (só com mouse; sobre botões e links volta o cursor normal; no celular o dedo limpa direto, sem politriz). A politriz também faz uma passada sozinha ao abrir a página (no máximo 2). Para usar uma foto real de piso sujo, adicione `data-dirty="assets/img/arquivo.jpg"` na section (mesmo enquadramento da foto limpa). Tempo que a sujeira leva para voltar = `LIFE` em `js/effects.js`; tamanho da área limpa = `R`; tamanho da politriz = `TW` (px) em `makeTool()`.
- **Progresso**: barra verde no header e linha que enche no "Como funciona".
- Botões ficam parados e, no hover, crescem um pouco e clareiam. Quem ativa "reduzir movimento" no sistema vê a página sem os efeitos.
- A dobra 2 ("Trocar ou recuperar") é um card creme que invade o topo e a dobra de serviços. O quanto invade é `--overlap` no `:root` do `css/styles.css`.

## O que falta você trocar (nesta ordem)
Já estão com foto real: topo (par antes/depois sobre foto de obra clara), "Trocar ou recuperar", "Como funciona", "Serviços", "Por que a RPR" (funcionário recortado, `funcionario-politriz.webp`), fundo do topo (`hero-bg-obra.jpg` no desktop, `hero-bg-obra-mobile.jpg` no celular) e do CTA, terraço (para quem atendemos), 4 pares de resultados, logo, favicon e imagem de compartilhamento.
1. **Fotos que ainda são provisórias** (cinza com o nome escrito): `atende-residencial.jpg`, `atende-comercio-industria.jpg`, `atende-construtoras.jpg`. Salve a foto real **com o mesmo nome** por cima (800x600, deitada).
2. **Resultados 03 e 04** (rampa e calçada) vieram de artes do Instagram, em baixa resolução. Troque por fotos originais, 800x1000 (em pé), mesmo enquadramento e luz no antes e no depois.
3. **Mais pares de resultados**: copie um `<li class="carousel__slide card">` inteiro na dobra 4, troque os nomes das imagens e a legenda.
4. **Legendas dos pares**: hoje só dizem a superfície ("Bancada de granito preto"). Acrescente o serviço feito.
5. **Link das avaliações do Google** (dobra 7): procure `TODO` no `index.html` e coloque o link direto do Perfil.
6. **FAQ**: faltam 4 respostas da Sheila (móveis, apartamento, duração do resultado, piso sem recuperação). Estão em comentário `TODO` na dobra 10.
7. **Domínio**: `recuperapisosrpr.com` está no canonical, no Open Graph, no `robots.txt` e no `sitemap.xml`. Confira se é o endereço final.
- Se mudar uma imagem para `.webp`, troque a extensão no `index.html`.
- Regra dos pares: antes e depois com o mesmo enquadramento e luz, sem filtro.

## Medição (Google Ads)
Cada botão de WhatsApp envia `whatsapp_click` para o `dataLayer`, com o atributo `cta_location` (hero, troca, resultados, flutuante...). No Google Tag Manager, crie um acionador de evento personalizado `whatsapp_click` e use como conversão no Google Ads. Cole o código do GTM no `<head>` (há um comentário marcando o lugar).

## Publicar
Qualquer hospedagem estática serve (Vercel, Netlify, Cloudflare Pages, Hostinger). Suba a pasta inteira. Depois:
1. Ligue o domínio no Perfil da Empresa no Google (substitui a descrição antiga do site).
2. Peça a indexação da página no Google Search Console.

## Pendências de copy (do documento de copy)
- Confirmar com a Sheila: equipe uniformizada, serviço sem parar a rotina, atendimento em apartamentos.
- Textos novos que o Leo precisa aprovar: rótulos acima dos títulos (Serviços, Resultados, Avaliações...), mensagem pré-preenchida do WhatsApp e botão "WhatsApp" do header.
