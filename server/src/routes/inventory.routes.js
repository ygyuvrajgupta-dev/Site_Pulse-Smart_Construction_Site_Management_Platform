import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createCategory,
  getWarehouses,
  createWarehouse,
  getStockMovements,
  createStockMovement,
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  getInventoryStats,
} from "../services/inventory.service.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * Inventory Module routes.
 * Covers: Products, Categories, Warehouses, Stock, Purchase Orders, Suppliers, Barcode, QR Code
 */
const router = Router();

// All routes require authentication
router.use(protect);

// Inventory Statistics
router.get("/stats", getInventoryStats);

// Products
router.get("/products", getProducts);
router.post("/products", createProduct);
router.get("/products/:id", getProductById);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);

// Warehouses
router.get("/warehouses", getWarehouses);
router.post("/warehouses", createWarehouse);

// Stock
router.get("/stock", getStockMovements);
router.post("/stock", createStockMovement);

// Suppliers
router.get("/suppliers", getSuppliers);
router.post("/suppliers", createSupplier);

// Purchase Orders
router.get("/purchase-orders", getPurchaseOrders);
router.post("/purchase-orders", createPurchaseOrder);
router.put("/purchase-orders/:id/status", updatePurchaseOrderStatus);

export default router;