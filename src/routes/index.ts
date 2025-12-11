// ARQUIVO: src/routes/index.ts
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserController } from '../controllers/UserController';
import { RoleController } from '../controllers/RoleController';
import { HelpDeskController } from '../controllers/HelpDeskController'; // Novo
import { WfmController } from '../controllers/WfmController';


const router = Router();

const authController = new AuthController();
const userController = new UserController();
const roleController = new RoleController();
const helpDeskController = new HelpDeskController(); // Novo
const wfmController = new WfmController();

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
router.delete('/workstations/:id', helpDeskController.deleteWorkstation); // <--- NOVA


// Tickets
router.get('/tickets', helpDeskController.listTickets);
router.post('/tickets', helpDeskController.openTicket);
router.put('/tickets/:id/close', helpDeskController.closeTicket);

// --- WFM ---
router.get('/wfm/curves', wfmController.listCurves);
router.post('/wfm/curves', wfmController.createCurve);
router.post('/wfm/simulations', wfmController.createSimulation);
router.get('/wfm/simulations/:id', wfmController.getSimulation);
router.put('/wfm/items/:itemId', wfmController.updateSimulationItem);
// Adicione junto com as rotas de WFM
router.get('/wfm/curves/:id', wfmController.getCurve);   // Pegar detalhes
router.put('/wfm/curves/:id', wfmController.updateCurve); // Salvar detalhes
router.delete('/wfm/curves/:id', wfmController.deleteCurve); // <--- NOVA
router.get('/wfm/shrinkages', wfmController.listShrinkages);
router.post('/wfm/shrinkages', wfmController.createShrinkage);
router.delete('/wfm/shrinkages/:id', wfmController.deleteShrinkage); // <--- NOVA

export { router };