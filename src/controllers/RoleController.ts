// src/controllers/RoleController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RoleController {
  async index(req: Request, res: Response) {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' } // Ordena alfabeticamente
    });
    return res.json(roles);
  }
}