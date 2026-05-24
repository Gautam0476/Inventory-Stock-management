const mongoose = require('mongoose');

const categories = ['Electronics', 'Accessories', 'Office', 'Furniture', 'Packaging'];

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: categories,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sold: {
      type: Number,
      min: 0,
      default: 0,
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    id: false,
    versionKey: false,
  }
);

module.exports = mongoose.model('Product', productSchema);
