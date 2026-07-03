# Como colocar o site no ar cobrando Pix (passo a passo)

Objetivo: publicar o site + backend e cobrar R$ 5 via Pix (Mercado Pago) para
liberar o resultado. É de graça pra começar. Siga na ordem.

---

## Parte 1 — Pegar as credenciais do Mercado Pago

1. Crie/entre numa conta em https://www.mercadopago.com.br
2. Acesse o painel de desenvolvedores: https://www.mercadopago.com.br/developers/panel
3. Clique em **"Criar aplicação"** (nome qualquer, ex.: "testedeqi").
4. Abra a aplicação → menu **"Credenciais"**.
   - Comece pelas **Credenciais de teste** para testar sem dinheiro real.
   - Depois, use as **Credenciais de produção** para valer.
5. Copie o **Access Token** (é um texto longo, tipo `APP_USR-....` ou `TEST-....`).
   Guarde — você vai colar no Render na Parte 3.

---

## Parte 2 — Subir o código pro GitHub

1. Crie uma conta grátis em https://github.com
2. Clique em **New repository** → nome `testedeqi` → **Create repository**.
3. Na página do repositório vazio, clique em **"uploading an existing file"**.
4. Arraste TODOS os arquivos da pasta do projeto, **menos a pasta `node_modules`**
   (se existir). Inclua: `index.html`, `script.js`, `style.css`, `server.js`,
   `package.json`, `.gitignore` e a pasta `images/`.
5. Clique em **Commit changes**.

> Dica: se preferir, dá pra usar o GitHub Desktop (app) em vez de arrastar arquivos.

---

## Parte 3 — Publicar no Render (grátis)

1. Crie conta em https://render.com (pode entrar com o GitHub).
2. **New +** → **Web Service**.
3. Conecte seu GitHub e escolha o repositório `testedeqi`.
4. Preencha:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Em **Environment** → **Add Environment Variable**:
   - **Key**: `MP_ACCESS_TOKEN`
   - **Value**: o Access Token que você copiou na Parte 1
6. Clique em **Create Web Service** e espere o deploy terminar.
7. O Render te dá uma URL, tipo `https://testedeqi.onrender.com`. Esse é o seu site.

---

## Parte 4 — Ligar o pagamento de verdade

1. No arquivo [script.js](script.js), troque:
   ```js
   const DEV_MODE = true;
   ```
   por
   ```js
   const DEV_MODE = false;
   ```
2. Suba essa mudança pro GitHub (edite o arquivo direto no site do GitHub e faça
   Commit). O Render republica sozinho em ~1 min.
3. Abra sua URL do Render e faça o teste até o fim: agora o QR Code é real.

---

## Testar antes de cobrar de verdade

- Com as **credenciais de teste**, use o ambiente de teste do Mercado Pago
  (usuários de teste) para simular um pagamento aprovado, sem dinheiro real.
- Quando estiver tudo certo, troque o `MP_ACCESS_TOKEN` no Render pelas
  **credenciais de produção** e pronto: o Pix cai na sua conta do Mercado Pago.

---

## Rodar no seu PC antes (opcional)

```powershell
npm install
$env:MP_ACCESS_TOKEN="SEU_TOKEN"
npm start
```
Abra http://localhost:3000 (com `DEV_MODE = false` para testar o Pix real).

---

## Dúvidas comuns

- **O plano free do Render "dorme"** depois de um tempo sem acesso e demora alguns
  segundos pra acordar no primeiro acesso. Para site com movimento, vale um plano pago.
- **Segurança**: o resultado é calculado no navegador; um usuário técnico poderia
  burlar. Para blindar 100%, o cálculo vai pro backend — posso fazer se você quiser.
- **Nota fiscal / impostos**: cobrar de pessoas envolve obrigações fiscais. Vale
  confirmar como declarar essa receita (MEI costuma resolver para valores baixos).
