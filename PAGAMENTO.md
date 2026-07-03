# Cobrança Pix de R$ 5 para liberar o resultado

## Como funciona

1. O site termina o teste e mostra a **tela de pagamento** (paywall).
2. O usuário toca em "Desbloquear por R$ 5" → o site chama o **backend**, que cria
   uma cobrança Pix no provedor e devolve o **QR Code** + o **Pix copia e cola**.
3. O usuário paga. O provedor confirma o pagamento.
4. O site pergunta ao backend "já pagou?" (`/api/pix/status`) e, quando vem `pago`,
   **libera e mostra o resultado**.

> Importante: o pagamento **precisa** de um backend. Não dá pra confirmar Pix só no
> navegador — qualquer um abriria o console e liberaria de graça.

## Modo teste (agora)

No [script.js](script.js) existe `const DEV_MODE = true;`. Nesse modo o site simula
tudo (QR de exemplo + confirmação automática em ~5s) pra você ver o fluxo. Em
produção, troque para `false`.

## Contrato que o site espera do backend

- `POST /api/pix/criar` → `{ "id": "...", "qrImage": "data:image/png;base64,...", "copiaECola": "00020126..." }`
- `GET  /api/pix/status?id=...` → `{ "status": "pendente" | "pago" | "expirado" }`

## Backend de exemplo (Node + Mercado Pago)

```bash
npm init -y
npm install express cors mercadopago
```

Crie `server.js`:

```js
const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // serve o próprio site (index.html, script.js, imagens…)

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

app.post("/api/pix/criar", async (req, res) => {
  try {
    const r = await payment.create({
      body: {
        transaction_amount: 5.0,
        description: "Resultado do teste de QI",
        payment_method_id: "pix",
        payer: { email: "cliente@exemplo.com" },
      },
    });
    const td = r.point_of_interaction.transaction_data;
    res.json({
      id: String(r.id),
      qrImage: `data:image/png;base64,${td.qr_code_base64}`,
      copiaECola: td.qr_code,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "falha ao criar cobrança" });
  }
});

app.get("/api/pix/status", async (req, res) => {
  try {
    const info = await payment.get({ id: req.query.id });
    res.json({ status: info.status === "approved" ? "pago" : "pendente" });
  } catch (e) {
    res.json({ status: "pendente" });
  }
});

app.listen(3000, () => console.log("Rodando em http://localhost:3000"));
```

Rodar:

```bash
$env:MP_ACCESS_TOKEN="SEU_TOKEN_DE_PRODUCAO"   # (PowerShell)
node server.js
```

Pegue o **Access Token** em: Mercado Pago → Desenvolvedores → suas credenciais.
Comece com as credenciais de **teste**; depois troque pelas de produção.

Por fim, no [script.js](script.js), mude `DEV_MODE` para `false`. Como o `server.js`
já serve o site (`express.static`), o `fetch("/api/...")` funciona no mesmo endereço.

## Onde hospedar

Qualquer lugar que rode Node: **Render**, **Railway**, **Fly.io** (têm plano grátis)
ou uma VPS. O provedor de Pix não precisa de servidor "sempre ligado" para o QR,
mas precisa para o site responder `/api/pix/status`.

## Provedores alternativos

- **Mercado Pago** (exemplo acima) — mais popular, Pix nativo.
- **Asaas** / **AbacatePay** / **Efí (Gerencianet)** — gateways brasileiros com Pix.
  O contrato do site é o mesmo; só muda o código dentro de `/api/pix/criar` e
  `/api/pix/status`.

## Observação de segurança

O resultado é calculado no próprio navegador, então um usuário muito técnico
poderia ler o JavaScript e deduzir o resultado sem pagar. Para blindar 100%, o
cálculo do resultado teria que ir para o backend e só ser devolvido após o
pagamento confirmado. Para um teste recreativo, o paywall atual já cobre a
grande maioria dos usuários — posso fazer a versão "à prova de espertos" se quiser.
```
