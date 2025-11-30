// ===== CARGAR .ENV PRIMERO (ANTES DE TODO) =====
const dotenv = require('dotenv');
dotenv.config(); // ← Debe ser LA PRIMERA LÍNEA ejecutable

// ===== AHORA SÍ IMPORTAR EL RESTO =====
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const refreshRoutes = require('./routes/refresh');
const userRoutes = require('./routes/user');
const orderRoutes = require('./routes/order');
const productRoutes = require('./routes/product');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====
app.use(cors({
  origin: true, // Permite cualquier origen en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

// ===== RUTAS =====
app.use('/api/auth', authRoutes);
app.use('/api/auth/refresh', refreshRoutes);
app.use('/api', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// ===== SERVIR FRONTEND (ARCHIVOS ESTÁTICOS) =====
const frontendPath = path.join(__dirname, '../frontend');
const fs = require('fs');

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  // ===== MANEJO DE RUTAS DEL FRONTEND (SPA/PWA) =====
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  console.log('⚠️ Frontend no encontrado. Ejecutando en modo API-only.');
  app.get('/', (req, res) => {
    res.send('API Backend EcosDelCampo - Running 🚀');
  });
}

// ===== MONGODB =====
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  });

// ===== SERVIDOR =====
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
