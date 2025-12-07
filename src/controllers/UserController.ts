import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class UserController {
  
  // LISTAR
  async index(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { fullName: 'asc' },
        include: { role: true }
      });
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  // CRIAR
  async store(req: Request, res: Response) {
    try {
      // 1. Recebe os dados do formulário
      const { 
        email, password, roleId, 
        fullName, cpf, phone, 
        matricula, shift 
      } = req.body;

      // 2. Validação: Verifica se E-mail ou Matrícula já existem
      const check = await prisma.user.findFirst({
        where: { OR: [{ email }, { matricula }] }
      });

      if (check) {
        return res.status(400).json({ error: 'E-mail ou Matrícula já existem.' });
      }

      // 3. Criptografa a senha
      const hashPassword = await bcrypt.hash(password, 10);

      // 4. Cria o usuário
      // O truque "cpf || null" garante que string vazia vire nulo
      const user = await prisma.user.create({
        data: {
          email,
          username: email, // Usamos o email como username padrão
          password: hashPassword,
          roleId,
          fullName,
          matricula,
          // Campos opcionais: Se vier vazio (""), salva como null
          cpf: cpf || null,
          phone: phone || null,
          shift: shift || null
        }
      });

      return res.status(201).json(user);
    } catch (error) {
      console.error(error); // Isso ajuda a ver o erro real no terminal se acontecer
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }

  // ATUALIZAR (EDITAR)
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const data = req.body;

    try {
      // Se a senha veio vazia, remove ela do objeto para não apagar a senha antiga
      if (data.password && data.password.trim() !== "") {
        data.password = await bcrypt.hash(data.password, 10);
      } else {
        delete data.password;
      }

      // Tratamento para evitar erro de campo único vazio na edição
      if (data.cpf === "") data.cpf = null;
      if (data.phone === "") data.phone = null;

      const user = await prisma.user.update({
        where: { id },
        data: { ...data }
      });

      return res.json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  }
}