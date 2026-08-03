import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';

// Import controllers
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
} from '../services/lead.service.js';

import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../services/client.service.js';

import {
  getMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from '../services/meeting.service.js';

import {
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  completeFollowUp,
} from '../services/followup.service.js';

import {
  getPipeline,
  getPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  moveLeadToStage,
} from '../services/pipeline.service.js';

import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../services/note.service.js';

import {
  getFiles,
  uploadFile,
  deleteFile,
} from '../services/file.service.js';

const router = Router();

// All routes require authentication
router.use(protect);

// ============================================
// Leads
// ============================================
router.get('/leads', getLeads);
router.get('/leads/:id', getLeadById);
router.post('/leads', createLead);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);
router.post('/leads/:id/convert', convertLeadToClient);

// ============================================
// Clients
// ============================================
router.get('/clients', getClients);
router.get('/clients/:id', getClientById);
router.post('/clients', createClient);
router.put('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);

// ============================================
// Meetings
// ============================================
router.get('/meetings', getMeetings);
router.get('/meetings/:id', getMeetingById);
router.post('/meetings', createMeeting);
router.put('/meetings/:id', updateMeeting);
router.delete('/meetings/:id', deleteMeeting);

// ============================================
// Follow Ups
// ============================================
router.get('/followups', getFollowUps);
router.post('/followups', createFollowUp);
router.put('/followups/:id', updateFollowUp);
router.delete('/followups/:id', deleteFollowUp);
router.patch('/followups/:id/complete', completeFollowUp);

// ============================================
// Pipeline
// ============================================
router.get('/pipeline', getPipeline);
router.get('/pipeline/stages', getPipelineStages);
router.post('/pipeline/stages', createPipelineStage);
router.put('/pipeline/stages/:id', updatePipelineStage);
router.delete('/pipeline/stages/:id', deletePipelineStage);
router.patch('/pipeline/leads/:leadId/move/:stageId', moveLeadToStage);

// ============================================
// Notes (for leads and clients)
// ============================================
router.get('/notes', getNotes);
router.post('/notes', createNote);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

// ============================================
// Files (for leads and clients)
// ============================================
router.get('/files', getFiles);
router.post('/files', uploadFile);
router.delete('/files/:id', deleteFile);

export default router;