# Imagens das 10 primeiras perguntas

O site usa estes arquivos exatamente como você enviou. Cada pergunta = 2 arquivos:
`N.png` (a matriz, com o "?") e o par (o painel das 6 opções).

| Pergunta | Figura | Matriz | Opções | Resposta certa |
|----------|--------|--------|--------|----------------|
| 1  | Quadriculado fino     | `1.png`  | `12.png`   | superior esquerda |
| 2  | Cruzes (+)            | `2.png`  | `22.png`   | superior direita |
| 3  | Losangos com X        | `3.png`  | `33.png`   | superior esquerda |
| 4  | Grades de linhas      | `4.png`  | `44.png`   | meio direita |
| 5  | Ondas + barco         | `5.png`  | `55.png`   | superior direita |
| 6  | Quadradinhos          | `6.png`  | `66.png`   | inferior direita |
| 7  | Rostos                | `7.png`  | `77.png`   | inferior direita |
| 8  | Cubos empilhados      | `8.png`  | `88.png`   | inferior esquerda |
| 9  | Borboletas            | `9.png`  | `99.png`   | superior direita |
| 10 | Estilhaços            | `10.png` | `1010.png` | superior esquerda |

## Trocar uma imagem

Basta substituir o arquivo pelo de mesmo nome (ex.: salvar por cima de `4.png`).
Se quiser mudar a resposta certa de alguma, é o campo `correct` em `script.js`
(0 = sup. esq, 1 = sup. dir, 2 = meio esq, 3 = meio dir, 4 = inf. esq, 5 = inf. dir).

Obs.: os painéis de opções já têm o título "Escolha sua resposta:" embutido; por
isso as áreas clicáveis começam ~13% abaixo do topo da imagem (ajuste em `style.css`,
`.options-hotspots`).
