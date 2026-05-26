const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const DeliveryZone = require('../models/DeliveryZone');
const { sendWhatsAppNotification } = require('../utils/whatsapp');
const { body, validationResult } = require('express-validator');

// POST - Create new order (public)
router.post('/', [
    body('customer.name').notEmpty().withMessage('Name is required').trim(),
    body('customer.phone').isMobilePhone('any').withMessage('Valid phone number required'),
    body('delivery.area').notEmpty().withMessage('Delivery area is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('payment.method').isIn(['cash', 'mpesa']).withMessage('Invalid payment method')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { customer, delivery, items, subtotal, payment, notes } = req.body;

        // Calculate delivery fee from zone
        const zone = await DeliveryZone.findOne({ name: delivery.area, active: true });
        const deliveryFee = zone ? zone.fee : 200; // Default 200 if area not found
        
        const total = subtotal + deliveryFee;

        const order = new Order({
            customer,
            delivery: {
                area: delivery.area,
                fee: deliveryFee,
                address: delivery.address || ''
            },
            items,
            subtotal,
            deliveryFee,
            total,
            payment: {
                method: payment.method,
                status: payment.method === 'cash' ? 'pending' : 'pending'
            },
            status: 'pending',
            notes: notes || ''
        });

        await order.save();

        // Send WhatsApp notification (non-blocking)
        sendWhatsAppNotification(order).catch(console.error);

        res.status(201).json({
            success: true,
            orderId: order.orderNumber,
            orderNumber: order.orderNumber,
            total: order.total,
            message: `Order #${order.orderNumber} placed successfully!`
        });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to place order. Please try again.' 
        });
    }
});

// GET - Get order by ID (public)
router.get('/:orderId', async (req, res) => {
    try {
        const order = await Order.findOne({ orderNumber: req.params.orderId });
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch order' 
        });
    }
});

// GET - Track order by phone (public)
router.get('/track/:phone', async (req, res) => {
    try {
        const orders = await Order.find({ 
            'customer.phone': req.params.phone 
        }).sort({ createdAt: -1 }).limit(5);
        
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch orders' 
        });
    }
});

module.exports = router;