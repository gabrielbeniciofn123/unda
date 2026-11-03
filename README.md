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

- Substituir o lettering tipográfico pelo arquivo oficial do logotipo, se fornecido.
- Substituir a galeria conceitual (fotografias do Unsplash) pelos trabalhos autorizados da UNDA. As referências estão identificadas na interface e não são apresentadas como trabalhos reais.
- Conectar o showreel oficial. O vídeo atual é uma referência de atmosfera do Pexels, identificada no player, e não uma produção da UNDA.
- Configurar o WhatsApp comercial após receber o número com código do país e DDD. Hoje o botão prepara uma solicitação do contato pelo Instagram, explicitamente indicada na interface.
- Configurar um serviço de envio e o e-mail de destino antes de habilitar envio direto do formulário. Hoje o formulário valida os campos e prepara uma mensagem para copiar e enviar manualmente pelo Instagram; não afirma que um orçamento foi enviado.

Instagram oficial: https://www.instagram.com/unda.studios/

## Acessibilidade e desempenho

Navegação por teclado, diálogos nativos com Escape, preferências de movimento reduzido, imagens com carregamento progressivo, Three.js em módulo separado e limite de resolução e atualização do WebGL. O vídeo ambiente carrega apenas em telas maiores sem preferência por movimento reduzido. O conteúdo permanece navegável sem WebGL.
