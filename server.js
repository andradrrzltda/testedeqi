// Backend do testedeqi: serve o site e cria/consulta cobranças Pix no Mercado Pago.
// Requer a variável de ambiente MP_ACCESS_TOKEN (credencial do Mercado Pago).
const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, script.js, style.css, images/

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const payment = new Payment(client);

// Cria uma cobrança Pix de R$ 5 e devolve o QR Code + o copia-e-cola.
app.post("/api/pix/criar", async (req, res) => {
  try {
    const r = await payment.create({
      body: {
        transaction_amount: 5.0,
        description: "Resultado do teste de QI - testedeqi",
        payment_method_id: "pix",
        payer: { email: "cliente@testedeqi.com" },
      },
    });
    const td = r.point_of_interaction.transaction_data;
    res.json({
      id: String(r.id),
      qrImage: `data:image/png;base64,${td.qr_code_base64}`,
      copiaECola: td.qr_code,
    });
  } catch (e) {
    console.error("Erro ao criar Pix:", (e && e.message) || e);
    res.status(500).json({ erro: "falha ao criar cobrança" });
  }
});

// O site pergunta aqui se o pagamento já caiu.
app.get("/api/pix/status", async (req, res) => {
  try {
    const info = await payment.get({ id: req.query.id });
    res.json({ status: info.status === "approved" ? "pago" : "pendente" });
  } catch (e) {
    res.json({ status: "pendente" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`testedeqi rodando na porta ${PORT}`));
