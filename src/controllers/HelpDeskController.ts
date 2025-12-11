import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HelpDeskController {

  // Listar
  async listWorkstations(req: Request, res: Response) {
    const stations = await prisma.workstation.findMany();
    return res.json(stations);
  }

  // Criar
  async createWorkstation(req: Request, res: Response) {
    const { name } = req.body;
    const station = await prisma.workstation.create({
      data: { name, posX: 50, posY: 50 }
    });
    return res.json(station);
  }

  // Atualizar (Mover ou Renomear)
  async updateWorkstation(req: Request, res: Response) {
    const { id } = req.params;
    const { posX, posY, name } = req.body; // Agora aceita name também

    const station = await prisma.workstation.update({
      where: { id },
      data: { 
        posX: posX, 
        posY: posY,
        name: name // Se vier nome, atualiza
      }
    });
    return res.json(station);
  }

  // EXCLUIR MESA (Novo)
  async deleteWorkstation(req: Request, res: Response) {
    const { id } = req.params;
    
    // Primeiro apaga os tickets vinculados para não dar erro de banco de dados
    await prisma.ticket.deleteMany({ where: { workstationId: id } });
    
    // Depois apaga a mesa
    await prisma.workstation.delete({ where: { id } });
    
    return res.json({ message: 'Mesa excluída' });
  }

  // --- TICKETS (Manteve igual) ---
  async listTickets(req: Request, res: Response) {
    const tickets = await prisma.ticket.findMany({
      include: { workstation: true, opener: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(tickets);
  }

  async openTicket(req: Request, res: Response) {
    const { title, category, workstationId, openerId } = req.body;
    const ticket = await prisma.ticket.create({
      data: { title, category, workstationId, openerId }
    });
    await prisma.workstation.update({ where: { id: workstationId }, data: { status: 'ERROR' } });
    return res.json(ticket);
  }

  async closeTicket(req: Request, res: Response) {
    const { id } = req.params;
    const { solverId } = req.body;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return res.status(404).json({error: 'Ticket não encontrado'});

    await prisma.ticket.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), solverId } });

    const openTickets = await prisma.ticket.count({
      where: { workstationId: ticket.workstationId, status: 'OPEN' }
    });

    if (openTickets === 0) {
      await prisma.workstation.update({ where: { id: ticket.workstationId }, data: { status: 'OK' } });
    }
    return res.json({ message: 'Fechado' });
  }
}