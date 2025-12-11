// ARQUIVO: src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // Importante para achar as pastas
import { router } from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DO EJS (NOVO)
app.set('view engine', 'ejs'); // Diz que usaremos EJS
app.set('views', path.join(__dirname, '../views')); // Onde ficam os HTMLs picados

// Serve os arquivos estáticos (CSS, JS, Imagens) da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Usa as rotas da API
app.use(router);

// ROTA PRINCIPAL (Renderiza o Layout)
app.get('/', (req, res) => {
  res.render('layout'); // Procura views/layout.ejs
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});