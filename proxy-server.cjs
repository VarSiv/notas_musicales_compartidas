// proxy-server.cjs
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Asegurate de tener esto instalado

const app = express();
const PORT = 3001;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyShw80k3kUfE04-uoz1NFBlDtBZBDCoNXQAcik6ZbRhXLhZ__OQuAGhFn8_WxIKhV1Hw/exec';

app.use(cors());
app.use(express.json());

app.post('/add-song', async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(req.body),
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error('💥 Error al reenviar la canción:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎧 Proxy corriendo en http://localhost:${PORT}`);
});
