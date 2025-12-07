// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes'; // Importa nossas rotas

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Usa as rotas que criamos
app.use(router);

// Serve os arquivos do site (Frontend)
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});