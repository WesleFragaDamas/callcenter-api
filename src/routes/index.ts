// ARQUIVO: src/routes/index.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import { RoleController } from '../controllers/RoleController';
import { HelpDeskController } from '../controllers/HelpDeskController'; // Novo

const router = Router();

const authController = new AuthController();
const userController = new UserController();
const roleController = new RoleController();
const helpDeskController = new HelpDeskController(); // Novo

// --- Rotas Base ---
router.post('/login', authController.login);
router.get('/roles', roleController.index);

// --- Rotas Usuários ---
router.get('/users', userController.index);
router.post('/users', userController.store);
router.put('/users/:id', userController.update);

// --- Rotas Help Desk (NOVAS) ---
// Mesas
router.get('/workstations', helpDeskController.listWorkstations);
router.post('/workstations', helpDeskController.createWorkstation);
router.put('/workstations/:id', helpDeskController.updateWorkstation); // Mover

// Tickets
router.get('/tickets', helpDeskController.listTickets);
router.post('/tickets', helpDeskController.openTicket);
router.put('/tickets/:id/close', helpDeskController.closeTicket);

export { router };