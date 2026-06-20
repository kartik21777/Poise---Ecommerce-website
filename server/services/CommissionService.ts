import { Order } from '../models/Order.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const log = logger('CommissionService');

export class CommissionService {
  /**
   * Splits a customer Order into multiple VendorOrders and stores immutable commission snapshots.
   * This should be called exactly once when the parent order is confirmed/paid.
   */
  async splitOrder(orderId: string | mongoose.Types.ObjectId): Promise<void> {
    const parentOrder = await Order.findById(orderId);
    if (!parentOrder) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Check if vendor orders already exist to prevent duplicate splitting
    const existingSplits = await VendorOrder.find({ parentOrderId: parentOrder._id });
    if (existingSplits.length > 0) {
      log.info(`Order ${orderId} already split into ${existingSplits.length} vendor orders.`);
      return;
    }

    // Map to group items by vendorId or 'PLATFORM'
    // null or undefined means platform owned
    const vendorItemsMap = new Map<string, any[]>();

    for (const item of parentOrder.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        log.warn(`Product ${item.productId} not found during order split`);
        continue;
      }

      let vendorIdStr = 'PLATFORM';
      if (product.ownershipType === 'VENDOR' && product.vendorId) {
        vendorIdStr = product.vendorId.toString();
      }

      if (!vendorItemsMap.has(vendorIdStr)) {
        vendorItemsMap.set(vendorIdStr, []);
      }
      vendorItemsMap.get(vendorIdStr)!.push(item);
    }

    // Create VendorOrder records
    for (const [vendorIdStr, items] of vendorItemsMap.entries()) {
      if (vendorIdStr === 'PLATFORM') {
        // Platform items don't need a VendorOrder document, but we might want to track platform portion in future
        continue;
      }

      const vendor = await Vendor.findById(vendorIdStr);
      if (!vendor) {
        log.warn(`Vendor ${vendorIdStr} not found for order ${orderId} split`);
        continue;
      }

      // Calculate totals for this vendor
      let vendorSubtotal = 0;
      for (const item of items) {
        vendorSubtotal += item.lineTotal;
      }

      // Simplistic approach for shipping and tax: allocate proportionally or skip
      // For this phase, we'll assign shipping/tax proportionally based on subtotal
      const proportion = vendorSubtotal / parentOrder.subtotal;
      const vendorTax = Number((parentOrder.tax * proportion).toFixed(2));
      const vendorShipping = Number((parentOrder.shipping * proportion).toFixed(2));
      const vendorTotal = Number((vendorSubtotal + vendorTax + vendorShipping).toFixed(2));

      // Calculate commission from subtotal (standard practice)
      const commissionRate = vendor.commissionRate;
      const commissionAmount = Number((vendorSubtotal * commissionRate).toFixed(2));
      
      // Net revenue for vendor is subtotal - commission + shipping + tax
      // (Assuming vendor collects shipping and tax, then remits tax themselves, or you subtract if platform handles it.
      // We will assume net Vendor revenue = vendorTotal - commissionAmount)
      const netVendorRevenue = Number((vendorTotal - commissionAmount).toFixed(2));

      const vendorOrder = new VendorOrder({
        vendorId: vendor._id,
        parentOrderId: parentOrder._id,
        customerUserId: parentOrder.user,
        orderNumber: `${parentOrder.orderNumber}-${vendorIdStr.slice(-4)}`,
        items: items,
        subtotal: vendorSubtotal,
        tax: vendorTax,
        shipping: vendorShipping,
        total: vendorTotal,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        netVendorRevenue: netVendorRevenue,
        status: parentOrder.status === 'PENDING' ? 'PENDING' : 'PAID', // Sync initial status
        paymentStatus: parentOrder.paymentStatus,
        shippingAddress: parentOrder.shippingAddress,
      });

      await vendorOrder.save();
    }
  }

  /**
   * Syncs the status of VendorOrders when the ParentOrder status changes.
   */
  async syncVendorOrderStatuses(orderId: string | mongoose.Types.ObjectId, updates: any): Promise<void> {
    const payloads: any = {};
    if (updates.status) payloads.status = updates.status;
    if (updates.paymentStatus) payloads.paymentStatus = updates.paymentStatus;
    
    if (Object.keys(payloads).length > 0) {
      await VendorOrder.updateMany({ parentOrderId: orderId }, { $set: payloads });
    }
  }
}
