const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
});

const orderSchema = new mongoose.Schema({
    orderNumber: { 
        type: String, 
        unique: true,
        index: true
    },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true }
    },
    delivery: {
        area: { type: String, required: true },
        fee: { type: Number, default: 0 },
        address: { type: String, default: '' },
        rider: { type: String, default: '' },
        tracking: { type: String, default: '' }
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    payment: {
        method: { type: String, enum: ['cash', 'mpesa'], required: true },
        status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
        mpesaCode: { type: String, default: '' },
        mpesaReceipt: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `MK${year}${month}${day}${random}`;
    }
    next();
});

// Index for faster queries
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'customer.phone': 1 });

module.exports = mongoose.model('Order', orderSchema);