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

- O cabeçalho usa `public/unda-logo.png`, uma cópia inalterada do arquivo de maior resolução “Logo ‘unda’ em Vidro Líquido.png” fornecido na pasta do projeto. O contêiner recorta apenas as margens vazias da imagem por CSS, preservando o desenho, as cores e as proporções da marca. Não há ampliação da logo no Hero nem uso como textura 3D.
- Substituir a galeria conceitual (fotografias do Unsplash) pelos trabalhos autorizados da UNDA. As referências estão identificadas na interface e não são apresentadas como trabalhos reais.
- Conectar o showreel oficial. O vídeo atual é uma referência de atmosfera do Pexels, identificada no player, e não uma produção da UNDA.
- Configurar o WhatsApp comercial após receber o número com código do país e DDD. Hoje o botão prepara uma solicitação do contato pelo Instagram, explicitamente indicada na interface.
- Configurar um serviço de envio e o e-mail de destino antes de habilitar envio direto do formulário. Hoje o formulário valida os campos e prepara uma mensagem para copiar e enviar manualmente pelo Instagram; não afirma que um orçamento foi enviado.

Instagram oficial: https://www.instagram.com/unda.studios/

## Acessibilidade e desempenho

Navegação por teclado, diálogos nativos com Escape, preferências de movimento reduzido, imagens com carregamento progressivo e Three.js em módulo separado. A cena limita a resolução e a atualização a 30 fps e interrompe a renderização fora da tela. Celulares usam menos subdivisões e resolução menor, mantendo o material de vidro. O conteúdo permanece navegável sem WebGL.

O fluxo orgânico é calculado na GPU, com normais corrigidas pela transformação da superfície para manter os reflexos coerentes. O buffer de refração usa escala de resolução 0,8 no desktop e 0,55 no celular; a dispersão cromática é desativada no celular. O agendamento de quadros para quando a cena sai da tela ou a aba fica oculta. Com movimento reduzido, a cena permanece estática. Luz ambiente, pontos de profundidade, entrada tipográfica e microinterações respeitam essa preferência.

O Hero está em `src/Hero.tsx`, com estilos locais em `src/hero.css`. A cena em `src/Liquid.tsx` contém duas curvas de vidro com volume fechado e seção oval, geradas com BufferGeometry ao longo de curvas Catmull–Rom. MeshPhysicalMaterial fornece transmissão, refração, absorção e dispersão, com iluminação de estúdio refletida gerada localmente. A cena usa um fundo preto opaco para evitar artefatos de composição na transmissão. As ondas ficam na área direita, e o título e o botão ocupam uma coluna independente. As outras seções permanecem em `src/main.tsx`.
