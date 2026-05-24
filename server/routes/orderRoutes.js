const express = require('express');
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

function orderFilter(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return { _id: param };
  }

  return { id: param };
}

async function restoreStock(order) {
  await Product.findOneAndUpdate(
    { sku: order.productSku },
    {
      $inc: {
        stock: Number(order.quantity),
        sold: -Number(order.quantity),
      },
      $set: {
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    }
  );
}

async function createOrderFromPayload(payload, orderId) {
  const quantity = Math.max(0, Number(payload.quantity) || 0);

  if (!payload.customerName || !payload.customerEmail || !payload.customerPhone || !payload.productSku || quantity < 1) {
    const error = new Error('Customer details, product SKU, and a valid quantity are required.');
    error.statusCode = 400;
    throw error;
  }

  const product = await Product.findOneAndUpdate(
    {
      sku: String(payload.productSku).toUpperCase(),
      stock: { $gte: quantity },
    },
    {
      $inc: {
        stock: -quantity,
        sold: quantity,
      },
      $set: {
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    },
    { new: true }
  );

  if (!product) {
    const error = new Error('Product not found or insufficient stock.');
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.create({
    id: orderId || payload.id || `ORD-${Date.now()}`,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    productSku: product.sku,
    productName: product.name,
    quantity,
    status: payload.status || 'Completed',
    unitPrice: Number(product.price),
    amount: Number(product.price) * quantity,
    date: payload.date,
  });

  return { order, product };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const result = await createOrderFromPayload(req.body);
    res.status(201).json(result);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existingOrder = await Order.findOne(orderFilter(req.params.id));

    if (!existingOrder) {
      res.status(404);
      throw new Error('Order not found.');
    }

    await restoreStock(existingOrder);
    await Order.deleteOne({ _id: existingOrder._id });

    const result = await createOrderFromPayload(req.body, existingOrder.id);
    res.json(result);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOneAndDelete(orderFilter(req.params.id));

    if (!order) {
      res.status(404);
      throw new Error('Order not found.');
    }

    await restoreStock(order);
    res.json({ message: 'Order deleted and inventory restored.', order });
  })
);

module.exports = router;
