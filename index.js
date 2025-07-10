// Fichero: index.js (La versión correcta para Render)

const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const app = express();

app.use(express.json());

// Leemos las claves secretas de las "Variables de Entorno" de Render. ¡Es más seguro!
// La línea .replace() es importante para que la clave privada funcione bien.
const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
const clientEmail = process.env.CLIENT_EMAIL;
const userToImpersonate = "auto.onboarding@vitaly.es";

app.get("/token", async (req, res) => {
  // Comprobamos si las variables de entorno existen
  if (!privateKey || !clientEmail) {
    return res.status(500).json({ error: "Error: Faltan las variables de entorno PRIVATE_KEY o CLIENT_EMAIL en la configuración de Render." });
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/admin.directory.user https://www.googleapis.com/auth/apps.licensing https://www.googleapis.com/auth/ediscovery https://www.googleapis.com/auth/ediscovery.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
    sub: userToImpersonate,
  };

  const signedJWT = jwt.sign(payload, privateKey, { algorithm: "RS256" });

  try {
    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        params: {
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: signedJWT,
        },
      }
    );
    res.json({ access_token: response.data.access_token });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Render nos da un puerto a través de la variable de entorno PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servicio funcionando en el puerto ${PORT}`);
});
