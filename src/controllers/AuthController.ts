// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    // 1. Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true } // Traz o cargo junto
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuário ou senha incorretos' });
    }

    // 2. Verifica se a senha bate (Descriptografa e compara)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Usuário ou senha incorretos' });
    }

    // 3. Verifica se está ativo
    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuário desativado. Contate o RH.' });
    }

    // 4. Gera o Token (O Crachá)
    const token = jwt.sign(
      { id: user.id, role: user.role.name },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1d' } // Expira em 1 dia
    );

    // 5. Retorna os dados para o site (sem mandar a senha!)
    return res.json({
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role.name
      },
      token
    });
  }
}