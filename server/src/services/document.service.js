import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * ============================================
 * FOLDERS
 * ============================================
 */
export async function getFolders(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.id;

    const folders = await prisma.folder.findMany({
      where: {
        companyId,
        isArchived: false,
        OR: [
          { visibility: 'COMPANY' },
          { visibility: 'SHARED', shares: { some: { userId } } },
          { visibility: 'PRIVATE', createdBy: userId },
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        createdByUser: { select: { name: true } },
        _count: { select: { documents: true, subfolders: true } },
      },
    });

    return response.success(res, folders);
  } catch (error) { next(error); }
}

export async function createFolder(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const userId = req.user.id;
    const { name, parentId, description, visibility } = req.body;

    const folder = await prisma.folder.create({
      data: {
        companyId,
        name,
        parentId,
        description,
        visibility: visibility || 'COMPANY',
        createdBy: userId,
      },
      include: {
        createdByUser: { select: { name: true } },
        _count: { select: { documents: true } },
      },
    });

    // If shared, create shares
    if (visibility === 'SHARED' && req.body.sharedUserIds) {
      await prisma.folderShare.createMany({
        data: req.body.sharedUserIds.map(uid => ({
          folderId: folder.id,
          userId: uid,
        })),
      });
    }

    return response.success(res, folder, 'Folder created', 201);
  } catch (error) { next(error); }
}

export async function updateFolder(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const folder = await prisma.folder.findFirst({ where: { id, companyId } });
    if (!folder) throw new AppError('Folder not found', 404);

    const updated = await prisma.folder.update({
      where: { id },
      data: req.body,
      include: {
        createdByUser: { select: { name: true } },
        _count: { select: { documents: true } },
      },
    });

    return response.success(res, updated, 'Folder updated');
  } catch (error) { next(error); }
}

export async function deleteFolder(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const folder = await prisma.folder.findFirst({ where: { id, companyId } });
    if (!folder) throw new AppError('Folder not found', 404);

    await prisma.folder.update({
      where: { id },
      data: { isArchived: true },
    });

    return response.success(res, null, 'Folder archived');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * DOCUMENTS
 * ============================================
 */
export async function getDocuments(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const folderId = req.query.folderId;

    const where = { companyId, isArchived: false };
    if (folderId) where.folderId = folderId;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    return response.success(res, documents);
  } catch (error) { next(error); }
}

export async function uploadDocument(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const uploaderId = req.user.id;
    const { name, folderId, leadId, clientId, category, description, tags } = req.body;

    let fileUrl = req.body.fileUrl;
    let fileName = req.body.fileName;
    let fileSize = parseInt(req.body.fileSize);
    let mimeType = req.body.mimeType;

    if (req.file) {
      fileUrl = req.file.path;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    }

    const document = await prisma.document.create({
      data: {
        companyId,
        uploaderId,
        folderId,
        leadId,
        clientId,
        category: category || 'OTHER',
        name: name || fileName,
        fileName,
        fileSize,
        mimeType,
        url: fileUrl,
        description,
        tags: tags || [],
      },
      include: {
        uploader: { select: { name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    // If shared with users
    if (req.body.sharedUserIds) {
      await prisma.documentShare.createMany({
        data: req.body.sharedUserIds.map(uid => ({
          documentId: document.id,
          userId: uid,
        })),
      });
    }

    return response.success(res, document, 'Document uploaded', 201);
  } catch (error) { next(error); }
}

export async function getDocument(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const document = await prisma.document.findFirst({
      where: { id, companyId },
      include: {
        uploader: { select: { name: true } },
        folder: { select: { id: true, name: true } },
        shares: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    if (!document) throw new AppError('Document not found', 404);

    return response.success(res, document);
  } catch (error) { next(error); }
}

export async function updateDocument(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const document = await prisma.document.findFirst({ where: { id, companyId } });
    if (!document) throw new AppError('Document not found', 404);

    const updated = await prisma.document.update({
      where: { id },
      data: req.body,
      include: {
        uploader: { select: { name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    return response.success(res, updated, 'Document updated');
  } catch (error) { next(error); }
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const document = await prisma.document.findFirst({ where: { id, companyId } });
    if (!document) throw new AppError('Document not found', 404);

    await prisma.document.update({
      where: { id },
      data: { isArchived: true },
    });

    return response.success(res, null, 'Document archived');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * FILE UPLOAD UTILITY
 * ============================================
 */
export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return response.success(res, {
      url: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    }, 'File uploaded');
  } catch (error) { next(error); }
}