const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.appBaseUrl, credentials: false }));
app.use(express.json({ limit: '200kb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { fallthrough: true, maxAge: '7d' }));
app.use('/api', require('./routes'));

// Produksi: backend ikut menyajikan hasil build frontend (folder backend/public)
const publik = path.join(__dirname, '..', 'public');
if (fs.existsSync(path.join(publik, 'index.html'))) {
  app.use(express.static(publik));
  app.get('/{*rute}', (_req, res) => res.sendFile(path.join(publik, 'index.html')));
}

app.use(errorHandler);
module.exports = app;
