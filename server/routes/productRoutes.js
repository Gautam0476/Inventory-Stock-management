const express = require('express');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/asyncHandler');
const sampleProducts = require('../data/sampleProducts');

const router = express.Router();

function productFilter(param) {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return { _id: param };
  }

  if (/^\d+$/.test(param)) {
    return { id: Number(param) };
  }

  return { sku: String(param).toUpperCase() };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const nextProduct = {
      sku: req.body.sku,
      name: req.body.name,
      category: req.body.category,
      stock: Number(req.body.stock),
      reorderLevel: Number(req.body.reorderLevel),
      price: Number(req.body.price),
      cost: Number(req.body.cost),
      sold: Number(req.body.sold || 0),
      updatedAt: req.body.updatedAt || new Date().toISOString().slice(0, 10),
    };

    if (!nextProduct.sku || !nextProduct.name || !nextProduct.category) {
      res.status(400);
      throw new Error('SKU, name, and category are required.');
    }

    const product = await Product.create(nextProduct);
    res.status(201).json(product);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndUpdate(
      productFilter(req.params.id),
      {
        ...req.body,
        sku: req.body.sku ? String(req.body.sku).toUpperCase() : undefined,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      res.status(404);
      throw new Error('Product not found.');
    }

    res.json(product);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findOneAndDelete(productFilter(req.params.id));

    if (!product) {
      res.status(404);
      throw new Error('Product not found.');
    }

    res.json({ message: 'Product deleted.', product });
  })
);

router.post(
  '/reset/sample-data',
  asyncHandler(async (req, res) => {
    await Product.deleteMany({});
    await Order.deleteMany({});
    const products = await Product.insertMany(sampleProducts);

    res.json({
      message: 'Inventory reset to sample stock data.',
      products,
    });
  })
);

module.exports = router;
