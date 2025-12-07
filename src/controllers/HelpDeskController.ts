// ARQUIVO: src/controllers/HelpDeskController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HelpDeskController {

  // --- MESAS (WORKSTATIONS) ---

  // Listar todas as mesas (para o mapa)
  async listWorkstations(req: Request, res: Response) {
    const stations = await prisma.workstation.findMany();
    return res.json(stations);
  }

  // Criar nova mesa (Admin)
  async createWorkstation(req: Request, res: Response) {
    const { name } = req.body;
    const station = await prisma.workstation.create({
      data: { name, posX: 50, posY: 50 } // Nasce no canto esquerdo
    });
    return res.json(station);
  }

  // Atualizar posição (Arrastar e Soltar)
  async updateWorkstation(req: Request, res: Response) {
    const { id } = req.params;
    const { posX, posY } = req.body;

    const station = await prisma.workstation.update({
      where: { id },
      data: { posX, posY }
    });
    return res.json(station);
  }

  // --- CHAMADOS (TICKETS) ---

  // Listar chamados (Fila da TI)
  async listTickets(req: Request, res: Response) {
    const tickets = await prisma.ticket.findMany({
      include: { 
        workstation: true,
        opener: { select: { fullName: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(tickets);
  }

  // Abrir Chamado (Muda cor da mesa para VERMELHO)
  async openTicket(req: Request, res: Response) {
    const { title, category, description, workstationId, openerId } = req.body;

    // 1. Cria o Ticket
    const ticket = await prisma.ticket.create({
      data: { title, category, description, workstationId, openerId }
    });

    // 2. Atualiza a mesa para ERROR (Vermelho)
    await prisma.workstation.update({
      where: { id: workstationId },
      data: { status: 'ERROR' }
    });

    return res.json(ticket);
  }

  // Fechar Chamado (Muda cor da mesa para VERDE)
  async closeTicket(req: Request, res: Response) {
    const { id } = req.params;
    const { solverId } = req.body;

    // 1. Busca o ticket para saber qual mesa é
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({error: 'Ticket não encontrado'});

    // 2. Atualiza Ticket
    await prisma.ticket.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), solverId }
    });

    // 3. Verifica se tem outros chamados abertos nessa mesa
    const openTickets = await prisma.ticket.count({
      where: { workstationId: ticket.workstationId, status: 'OPEN' }
    });

    // Se não tiver mais nenhum problema, volta pra OK (Verde)
    if (openTickets === 0) {
      await prisma.workstation.update({
        where: { id: ticket.workstationId },
        data: { status: 'OK' }
      });
    }

    return res.json({ message: 'Chamado encerrado' });
  }
}