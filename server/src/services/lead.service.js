import { response } from "../utils/response.js";
import { AppError } from "../middleware/errorHandler.js";
import prisma from "../config/db.js";

/**
 * CRM Lead service implemented against the actual Prisma Lead/Client models.
 * Lead  -> { firstName, lastName, email, phone, companyName, jobTitle, source,
 *            status, score, budget, notes, assignedToId, convertedToClientId }
 * Client-> { name, email, phone, website, address, city, state, country,
 *            postalCode, taxId, notes, isActive, leadId }
 * The frontend sends a flat shape ({ name, company, estimatedValue, ... }); the
 * helpers below map it onto the persisted model so only `name` is required.
 */

const VALID_SOURCES = ["WEBSITE","REFERRAL","SOCIAL_MEDIA","EMAIL_CAMPAIGN","COLD_CALL","PARTNER","OTHER"];
const VALID_STATUSES = ["NEW","CONTACTED","QUALIFIED","PROPOSAL","NEGOTIATION","WON","LOST","DISQUALIFIED"];

function splitName(name) {
  const full = String(name || "").trim();
  if (!full) return { firstName: "", lastName: "" };
  const space = full.indexOf(" ");
  if (space === -1) return { firstName: full, lastName: "" };
  return { firstName: full.slice(0, space).trim(), lastName: full.slice(space + 1).trim() };
}

function normalizeSource(source) {
  const s = String(source || "").toUpperCase();
  const mapped = { SOCIAL: "SOCIAL_MEDIA", EVENT: "OTHER" }[s] || s;
  return VALID_SOURCES.includes(mapped) ? mapped : "WEBSITE";
}

function normalizeStatus(status) {
  const s = String(status || "").toUpperCase();
  return VALID_STATUSES.includes(s) ? s : "NEW";
}

function buildLeadData(body, withCompanyId) {
  const { firstName, lastName } = splitName(body.name);
  const data = {};
  if (withCompanyId) data.companyId = body.companyId;
  data.firstName = firstName;
  data.lastName = lastName;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.company !== undefined) data.companyName = body.company || null;
  if (body.jobTitle !== undefined) data.jobTitle = body.jobTitle || null;
  if (body.source !== undefined) data.source = normalizeSource(body.source);
  if (body.status !== undefined) data.status = normalizeStatus(body.status);
  if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null;
  if (body.estimatedValue !== undefined && body.estimatedValue !== null && body.estimatedValue !== "") {
    data.budget = parseFloat(body.estimatedValue);
  }
  if (body.description !== undefined) data.notes = body.description || null;
  return data;
}

const leadListSelect = {
  id: true, firstName: true, lastName: true, email: true, phone: true,
  companyName: true, jobTitle: true, source: true, status: true,
  budget: true, score: true, createdAt: true, updatedAt: true,
  convertedToClientId: true,
  assignedTo: { select: { id: true, name: true, email: true } },
};

/** Get all leads for a company (pagination, search, status). */
export async function getLeads(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || "").trim();
    const status = req.query.status;
    const assignedToId = req.query.assignedToId;
    const skip = (page - 1) * limit;
    const where = { companyId };
    if (search) where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
    if (status && VALID_STATUSES.includes(String(status).toUpperCase())) where.status = status;
    if (assignedToId) where.assignedToId = assignedToId;
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: leadListSelect }),
      prisma.lead.count({ where }),
    ]);
    return response.success(res, { leads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

/** Get a single lead by ID. */
export async function getLeadById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const lead = await prisma.lead.findFirst({
      where: { id, companyId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
        clients: { select: { id: true, name: true, email: true } },
      },
    });
    if (!lead) throw new AppError("Lead not found", 404);
    return response.success(res, lead);
  } catch (error) { next(error); }
}

/** Create a new lead. Only `name` is required. */
export async function createLead(req, res, next) {
  try {
    const companyId = req.user.companyId;
    if (!req.body.name || !String(req.body.name).trim()) {
      throw new AppError("Lead name is required", 400);
    }
    const data = buildLeadData({ ...req.body, companyId }, true);
    data.assignedToId = req.body.assignedToId || req.user.id || null;
    const lead = await prisma.lead.create({ data, select: leadListSelect });
    return response.success(res, lead, "Lead created successfully", 201);
  } catch (error) { next(error); }
}

/** Update an existing lead. */
export async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const existing = await prisma.lead.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError("Lead not found", 404);
    const data = buildLeadData(req.body, false);
    if (req.body.assignedToId !== undefined) data.assignedToId = req.body.assignedToId || null;
    const lead = await prisma.lead.update({ where: { id }, data, select: leadListSelect });
    return response.success(res, lead, "Lead updated successfully");
  } catch (error) { next(error); }
}

/** Delete a lead. */
export async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const lead = await prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new AppError("Lead not found", 404);
    await prisma.lead.delete({ where: { id } });
    return response.success(res, null, "Lead deleted successfully");
  } catch (error) { next(error); }
}

/** Convert a lead to a client. */
export async function convertLeadToClient(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const lead = await prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) throw new AppError("Lead not found", 404);
    if (lead.convertedToClientId) throw new AppError("Lead has already been converted to a client", 400);
    const client = await prisma.client.create({
      data: {
        companyId,
        name: [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || "Converted Lead",
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
        leadId: lead.id,
        isActive: true,
      },
    });
    await prisma.lead.update({ where: { id }, data: { convertedToClientId: client.id } });
    return response.success(res, client, "Lead converted to client successfully", 201);
  } catch (error) { next(error); }
}
