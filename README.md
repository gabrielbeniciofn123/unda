# UNDA STUDIOS

Site institucional em React, TypeScript, Three.js, GSAP e Vite.

## Executar

```sh
npm install
npm run dev
```

## Produção

```sh
npm run build
npm run preview
```

A saída está em `dist/`. O comando de build também verifica os tipos TypeScript.

## Conteúdo oficial a conectar

- A arte original está preservada em `public/unda-logo.png`, uma cópia inalterada do arquivo de maior resolução “Logo ‘unda’ em Vidro Líquido.png” fornecido na pasta do projeto. O contêiner do cabeçalho recorta apenas as margens vazias da imagem por CSS, preservando o desenho, as cores e as proporções da marca. O Hero reaproveita essa arte em alta resolução, com um recorte por CSS que destaca somente a palavra unda na metade direita. O modo de composição screen integra seu fundo preto à cena sem reconstruir a identidade com outra fonte.
- Substituir a galeria conceitual (fotografias do Unsplash) pelos trabalhos autorizados da UNDA. As referências estão identificadas na interface e não são apresentadas como trabalhos reais.
- Conectar o showreel oficial. O vídeo atual é uma referência de atmosfera do Pexels, identificada no player, e não uma produção da UNDA.
- Configurar o WhatsApp comercial após receber o número com código do país e DDD. Hoje o botão prepara uma solicitação do contato pelo Instagram, explicitamente indicada na interface.
- Configurar um serviço de envio e o e-mail de destino antes de habilitar envio direto do formulário. Hoje o formulário valida os campos e prepara uma mensagem para copiar e enviar manualmente pelo Instagram; não afirma que um orçamento foi enviado.

Instagram oficial: https://www.instagram.com/unda.studios/

## Acessibilidade e desempenho

Navegação por teclado, diálogos nativos com Escape, preferências de movimento reduzido, imagens com carregamento progressivo e Three.js em módulo separado. A cena limita a resolução e a atualização a 30 fps e interrompe a renderização fora da tela. Celulares usam menos subdivisões e resolução menor, mantendo o material de vidro. O conteúdo permanece navegável sem WebGL.

O fluxo orgânico é calculado na GPU, com normais corrigidas pela transformação da superfície para manter os reflexos coerentes. O material usa reflexos metálicos e clearcoat sem a passagem extra de transmissão. As curvas têm 160 × 32 segmentos no desktop e 96 × 24 no celular. O agendamento de quadros para quando a cena sai da tela ou a aba fica oculta. Com movimento reduzido, a cena permanece estática. Luz ambiente, pontos de profundidade, entrada tipográfica e microinterações respeitam essa preferência.

O Hero está em `src/Hero.tsx`, com estilos locais em `src/hero.css`. A cena em `src/Liquid.tsx` contém duas curvas com volume fechado e seção oval, geradas com BufferGeometry ao longo de curvas Catmull–Rom. MeshPhysicalMaterial mantém o acabamento cromado em um canvas transparente, com reflexos de softboxes brancos, azuis e verdes gerados localmente. Uma onda passa acima e por trás da marca, e a outra ocupa a região inferior direita. A logo tem flutuação de até 4 px, variação suave de brilho e parallax limitado a 4 px na horizontal e 2 px na vertical. O título e o botão ocupam uma coluna independente; no celular, a composição visual fica abaixo deles. As outras seções permanecem em `src/main.tsx`.

O cabeçalho e o Hero servem `public/unda-logo.webp`, versão sem perdas do PNG original, que continua preservado no projeto. A imagem passou de 1.007.763 para 688.342 bytes (32% menor), com igualdade dos pixels decodificados verificada. O vídeo do showreel continua sendo montado somente ao abrir seu diálogo, sem download na primeira tela.

A fotografia de show já utilizada pelo site está salva localmente em `public/hero-audience.jpg` ([fonte no Unsplash](https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3)), integrada à parte inferior do Hero por um degradê e uma tonalidade azul. É uma referência de atmosfera, não uma produção identificada como trabalho da UNDA.
