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

- O cabeçalho e o destaque do Hero usam `public/logounda.jpg`, uma cópia inalterada da logo fornecida. `BrandMark.tsx` compõe a imagem no fundo escuro, tornando transparente o papel claro do JPG. Não usa fontes para reconstruir a marca. O arquivo disponível tem apenas 150 × 150 pixels; um original transparente em alta resolução permitirá melhorar a nitidez do destaque ampliado.
- Substituir a galeria conceitual (fotografias do Unsplash) pelos trabalhos autorizados da UNDA. As referências estão identificadas na interface e não são apresentadas como trabalhos reais.
- Conectar o showreel oficial. O vídeo atual é uma referência de atmosfera do Pexels, identificada no player, e não uma produção da UNDA.
- Configurar o WhatsApp comercial após receber o número com código do país e DDD. Hoje o botão prepara uma solicitação do contato pelo Instagram, explicitamente indicada na interface.
- Configurar um serviço de envio e o e-mail de destino antes de habilitar envio direto do formulário. Hoje o formulário valida os campos e prepara uma mensagem para copiar e enviar manualmente pelo Instagram; não afirma que um orçamento foi enviado.

Instagram oficial: https://www.instagram.com/unda.studios/

## Acessibilidade e desempenho

Navegação por teclado, diálogos nativos com Escape, preferências de movimento reduzido, imagens com carregamento progressivo e Three.js em módulo separado. O Hero usa ondas calculadas na GPU, limita a resolução e a atualização a 30 fps e interrompe a renderização fora da tela. Em celulares, usa menos subdivisões e dispensa a passagem de transmissão. O conteúdo permanece navegável sem WebGL.

O Hero está em `src/Hero.tsx`, com estilos locais em `src/hero.css`. A cena em `src/Liquid.tsx` contém duas fitas estreitas, concentradas na área direita. O título e o botão ocupam uma coluna independente. As outras seções permanecem em `src/main.tsx`.
