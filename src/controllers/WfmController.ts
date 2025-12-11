// ARQUIVO: src/controllers/WfmController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WfmController {

  // --- CURVAS ---
  async listCurves(req: Request, res: Response) {
    const curves = await prisma.distributionCurve.findMany();
    return res.json(curves);
  }

  async createCurve(req: Request, res: Response) {
    const { name, channel, intervals } = req.body;
    const curve = await prisma.distributionCurve.create({
      data: { name, channel, intervals }
    });
    return res.json(curve);
  }

  async getCurve(req: Request, res: Response) {
    const { id } = req.params;
    const curve = await prisma.distributionCurve.findUnique({ where: { id } });
    return res.json(curve);
  }

  async updateCurve(req: Request, res: Response) {
    const { id } = req.params;
    const { intervals } = req.body;
    const curve = await prisma.distributionCurve.update({
      where: { id },
      data: { intervals }
    });
    return res.json(curve);
  }

  async deleteCurve(req: Request, res: Response) {
    const { id } = req.params;
    try {
        await prisma.distributionCurve.delete({ where: { id } });
        return res.json({ message: 'Curva excluída' });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao excluir. Curva em uso.' });
    }
  }

  // --- SHRINKAGE (Fator de Correção) ---
  async listShrinkages(req: Request, res: Response) {
    const list = await prisma.shrinkageProfile.findMany();
    return res.json(list);
  }

  async createShrinkage(req: Request, res: Response) {
    const { name, items } = req.body;
    const profile = await prisma.shrinkageProfile.create({
      data: { name, items }
    });
    return res.json(profile);
  }

  async deleteShrinkage(req: Request, res: Response) {
    const { id } = req.params;
    try {
        await prisma.shrinkageProfile.delete({ where: { id } });
        return res.json({ message: 'Perfil excluído' });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao excluir perfil.' });
    }
  }

  // --- SIMULAÇÃO (CÁLCULO) ---
  async createSimulation(req: Request, res: Response) {
    try {
        const { description, channel, totalVolume, aht, slaTarget, slaTime, curveId, shrinkageId } = req.body;

        // VALIDAÇÃO 1: Curva existe?
        const curve = await prisma.distributionCurve.findUnique({ where: { id: curveId } });
        if (!curve) return res.status(404).json({ error: "Curva não encontrada" });

        // VALIDAÇÃO 2: A curva tem dados?
        const curveData = curve.intervals as any[];
        if (!curveData || curveData.length === 0) {
            return res.status(400).json({ error: "A curva selecionada está vazia ou inválida." });
        }

        // VALIDAÇÃO 3: Shrinkage (Trata string vazia como null)
        let totalShrinkage = 0;
        let validShrinkageId = null;

        if (shrinkageId && shrinkageId !== "") {
            validShrinkageId = shrinkageId;
            const shrinkProfile = await prisma.shrinkageProfile.findUnique({ where: { id: shrinkageId } });
            if (shrinkProfile) {
                const items = shrinkProfile.items as any[];
                totalShrinkage = items.reduce((acc, curr) => acc + (parseFloat(curr.percent) || 0), 0);
            }
        }

        // CÁLCULO
        const simulationItems = curveData.map(interval => {
            const pct = parseFloat(interval.percent) || 0;
            
            // Volume neste intervalo
            const vol = Math.round((totalVolume * pct) / 100);
            
            // Carga de Trabalho em Erlangs (Volume * AHT / 1800 segundos do intervalo de 30min)
            const workload = (vol * aht) / 1800;
            
            // Necessidade Bruta (Fórmula aproximada de Erlang C para Staff)
            // Se workload for zero, staff é zero.
            let rawStaff = 0;
            if (workload > 0) {
                // Aproximação simples: Workload + Margem de Segurança
                rawStaff = Math.ceil(workload + Math.sqrt(workload)); 
            }
            
            // Aplica Shrinkage (Fator de Correção)
            // Fórmula: Staff Real = Staff Bruto / (1 - %Perda)
            let realStaff = 0;
            if (rawStaff > 0) {
                const efficiency = 1 - (totalShrinkage / 100);
                if (efficiency <= 0) {
                    realStaff = rawStaff * 2; // Segurança contra divisão por zero ou negativo
                } else {
                    realStaff = Math.ceil(rawStaff / efficiency);
                }
            }

            return {
                interval: interval.time || "00:00",
                volume: vol,
                requiredAgents: realStaff,
                scheduledAgents: realStaff, // Sugere o mesmo valor calculado
                projectedSLA: slaTarget
            };
        });

        // SALVA NO BANCO
        const sim = await prisma.simulation.create({
            data: {
                description, channel, totalVolume, aht, slaTarget, slaTime, 
                curveId, 
                shrinkageId: validShrinkageId, // Usa o ID tratado
                items: { create: simulationItems }
            },
            include: { items: true }
        });

        return res.json(sim);

    } catch (error) {
        console.error("ERRO NO BACKEND:", error); // Isso vai aparecer no seu terminal do VSCode
        return res.status(500).json({ error: "Erro interno no cálculo. Verifique o console do servidor." });
    }
  }

  async getSimulation(req: Request, res: Response) {
    const { id } = req.params;
    const sim = await prisma.simulation.findUnique({
        where: { id },
        include: { items: { orderBy: { interval: 'asc' } } }
    });
    return res.json(sim);
  }

  async updateSimulationItem(req: Request, res: Response) {
    const { itemId } = req.params;
    const { scheduledAgents } = req.body;
    const item = await prisma.simulationItem.update({
        where: { id: itemId },
        data: { scheduledAgents }
    });
    return res.json(item);
  }
}