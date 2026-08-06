import { response } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import prisma from '../config/db.js';

/**
 * ============================================
 * PRODUCTS
 * ============================================
 */
export async function getProducts(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const categoryId = req.query.categoryId;

    const skip = (page - 1) * limit;
    const where = { companyId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          _count: { select: { stockMovements: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return response.success(res, { products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const product = await prisma.product.findFirst({
      where: { id, companyId },
      include: {
        category: true,
        stockMovements: { orderBy: { movedAt: 'desc' }, take: 20 },
      },
    });

    if (!product) throw new AppError('Product not found', 404);
    return response.success(res, product);
  } catch (error) { next(error); }
}

export async function createProduct(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, categoryId, sku, barcode, qrCode, description, type, unit, unitPrice, costPrice, currency, reorderPoint } = req.body;

    const product = await prisma.product.create({
      data: {
        companyId, name, categoryId, sku, barcode, qrCode, description,
        type: type || 'RAW_MATERIAL', unit,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        currency: currency || 'USD',
        reorderPoint: reorderPoint ? parseInt(reorderPoint) : null,
      },
      include: { category: { select: { name: true } } },
    });

    return response.success(res, product, 'Product created successfully', 201);
  } catch (error) { next(error); }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { name, categoryId, sku, barcode, qrCode, description, type, unit, unitPrice, costPrice, currency, reorderPoint, isActive } = req.body;

    const product = await prisma.product.findFirst({ where: { id, companyId } });
    if (!product) throw new AppError('Product not found', 404);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name, categoryId, sku, barcode, qrCode, description, type, unit,
        unitPrice: unitPrice !== undefined ? parseFloat(unitPrice) : undefined,
        costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
        currency, reorderPoint: reorderPoint !== undefined ? parseInt(reorderPoint) : undefined,
        isActive,
      },
      include: { category: { select: { name: true } } },
    });

    return response.success(res, updated, 'Product updated successfully');
  } catch (error) { next(error); }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const product = await prisma.product.findFirst({ where: { id, companyId } });
    if (!product) throw new AppError('Product not found', 404);

    await prisma.product.delete({ where: { id } });
    return response.success(res, null, 'Product deleted successfully');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * CATEGORIES
 * ============================================
 */
export async function getCategories(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const categories = await prisma.productCategory.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });

    return response.success(res, categories);
  } catch (error) { next(error); }
}

export async function createCategory(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, description, parentId } = req.body;

    const category = await prisma.productCategory.create({
      data: { companyId, name, description, parentId },
    });

    return response.success(res, category, 'Category created', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * WAREHOUSES
 * ============================================
 */
export async function getWarehouses(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const warehouses = await prisma.warehouse.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { stockMovements: true } } },
    });

    return response.success(res, warehouses);
  } catch (error) { next(error); }
}

export async function createWarehouse(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, code, address, city, state, country, manager } = req.body;

    const warehouse = await prisma.warehouse.create({
      data: { companyId, name, code, address, city, state, country, manager },
    });

    return response.success(res, warehouse, 'Warehouse created', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * STOCK
 * ============================================
 */
export async function getStockMovements(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { productId, type } = req.query;

    const where = { companyId };
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { movedAt: 'desc' },
      take: 50,
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
    });

    return response.success(res, movements);
  } catch (error) { next(error); }
}

export async function createStockMovement(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { productId, warehouseId, type, quantity, reference, notes } = req.body;

    const product = await prisma.product.findFirst({ where: { id: productId, companyId } });
    if (!product) throw new AppError('Product not found', 404);

    const movement = await prisma.stockMovement.create({
      data: {
        companyId, productId, warehouseId, type,
        quantity: parseInt(quantity),
        reference, notes,
        movedBy: req.user.id,
      },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
    });

    return response.success(res, movement, 'Stock movement recorded', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * SUPPLIERS
 * ============================================
 */
export async function getSuppliers(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { purchaseOrders: true } } },
    });

    return response.success(res, suppliers);
  } catch (error) { next(error); }
}

export async function createSupplier(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { name, email, phone, address, city, state, country, taxId, paymentTerms, notes } = req.body;

    const supplier = await prisma.supplier.create({
      data: { companyId, name, email, phone, address, city, state, country, taxId, paymentTerms, notes },
    });

    return response.success(res, supplier, 'Supplier created', 201);
  } catch (error) { next(error); }
}

/**
 * ============================================
 * PURCHASE ORDERS
 * ============================================
 */
export async function getPurchaseOrders(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const status = req.query.status;

    const where = { companyId };
    if (status) where.status = status;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: {
        supplier: { select: { name: true, email: true } },
        items: true,
      },
    });

    return response.success(res, orders);
  } catch (error) { next(error); }
}

export async function createPurchaseOrder(req, res, next) {
  try {
    const companyId = req.user.companyId;
    const { supplierId, orderNo, expectedDate, items, notes } = req.body;

    let subtotal = 0;
    const orderItems = (items || []).map(item => {
      const unitPrice = item.unitPrice ? parseFloat(item.unitPrice) : 0;
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: parseInt(item.quantity),
        unitPrice,
        totalPrice,
      };
    });

    const order = await prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId,
        orderNo: orderNo || `PO-${Date.now()}`,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        total: subtotal,
        createdBy: req.user.id,
        items: { create: orderItems },
      },
      include: {
        supplier: { select: { name: true } },
        items: true,
      },
    });

    return response.success(res, order, 'Purchase order created', 201);
  } catch (error) { next(error); }
}

export async function updatePurchaseOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const { status } = req.body;

    const order = await prisma.purchaseOrder.findFirst({ where: { id, companyId } });
    if (!order) throw new AppError('Purchase order not found', 404);

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        approvedBy: status === 'APPROVED' ? req.user.id : order.approvedBy,
        approvedAt: status === 'APPROVED' ? new Date() : order.approvedAt,
        receivedDate: status === 'RECEIVED' ? new Date() : order.receivedDate,
      },
      include: {
        supplier: { select: { name: true } },
        items: true,
      },
    });

    return response.success(res, updated, 'Purchase order status updated');
  } catch (error) { next(error); }
}

/**
 * ============================================
 * INVENTORY STATS
 * ============================================
 */
export async function getInventoryStats(req, res, next) {
  try {
    const companyId = req.user.companyId;

    const [
      productCount,
      categoryCount,
      warehouseCount,
      supplierCount,
      purchaseOrderCount,
      pendingOrders,
      stockIn,
      stockOut,
    ] = await Promise.all([
      prisma.product.count({ where: { companyId } }),
      prisma.productCategory.count({ where: { companyId } }),
      prisma.warehouse.count({ where: { companyId } }),
      prisma.supplier.count({ where: { companyId } }),
      prisma.purchaseOrder.count({ where: { companyId } }),
      prisma.purchaseOrder.count({ where: { companyId, status: 'PENDING' } }),
      prisma.stockMovement.aggregate({ where: { companyId, type: 'IN' }, _sum: { quantity: true } }),
      prisma.stockMovement.aggregate({ where: { companyId, type: 'OUT' }, _sum: { quantity: true } }),
    ]);

    return response.success(res, {
      totalProducts: productCount,
      totalCategories: categoryCount,
      totalWarehouses: warehouseCount,
      totalSuppliers: supplierCount,
      totalPurchaseOrders: purchaseOrderCount,
      pendingOrders,
      totalStockIn: stockIn._sum.quantity || 0,
      totalStockOut: stockOut._sum.quantity || 0,
    });
  } catch (error) { next(error); }
}