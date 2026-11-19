# UNDA STUDIOS

Site institucional em React, TypeScript, Three.js e Vite.

## Desenvolvimento

```sh
npm install
npm run dev
```

## Produção

```sh
npm run build
npm run preview
```

O build verifica os tipos TypeScript e gera o site estático em `dist/`.

## Conteúdo e contato

- As referências da galeria usam imagens WebP locais e responsivas. Os créditos estão em [public/media/SOURCES.txt](public/media/SOURCES.txt).
- O filme conceito usa um vídeo de referência da Pexels. O player carrega ao abrir o diálogo e indica a [página oficial da UNDA no Instagram](https://www.instagram.com/unda.studios/), onde estão as produções do estúdio.
- A chamada de orçamento leva ao formulário. O formulário monta um briefing para revisar, copiar e enviar pelo Instagram.

## Desempenho e acessibilidade

A primeira tela apresenta uma versão WebP da cena de vidro. Em computadores compatíveis, a cena Three.js é carregada depois da primeira pintura e fica em pausa quando sai da tela, a aba é ocultada ou um diálogo é aberto. Celulares, dispositivos com economia de dados e visitantes com preferência por movimento reduzido recebem a composição estática.

As fontes são servidas pelo próprio site. A galeria usa carregamento sob demanda. O menu móvel, os filtros, os diálogos e o formulário podem ser usados por teclado.
