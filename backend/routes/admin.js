const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const DeliveryZone = require('../models/DeliveryZone');
const MenuItem = require('../models/MenuItem');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

// POST - Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password required' });
        }
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            token, 
            user: { 
                id: user._id,
                name: user.name, 
                email: user.email, 
                role: user.role 
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// GET - All orders (protected)
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const { status, startDate, endDate, limit = 100 } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
        }
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        res.json({ success: true, orders, count: orders.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch orders' });
    }
});

// PUT - Update order status
router.put('/orders/:orderId/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }
        
        const order = await Order.findOne({ orderNumber: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }
        
        order.status = status;
        order.updatedAt = new Date();
        await order.save();
        
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update order' });
    }
});

// GET - Dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Today's orders
        const todayOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow }
        });
        
        // Pending orders count
        const pendingOrders = await Order.countDocuments({ 
            status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'] } 
        });
        
        // Total revenue today
        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
        
        // Last 7 days for chart
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const ordersCount = await Order.countDocuments({
                createdAt: { $gte: date, $lt: nextDay }
            });
            
            const revenueResult = await Order.aggregate([
                { $match: { createdAt: { $gte: date, $lt: nextDay } } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]);
            
            last7Days.push({
                date: date.toLocaleDateString('en-KE', { weekday: 'short' }),
                fullDate: date.toISOString().split('T')[0],
                orders: ordersCount,
                revenue: revenueResult[0]?.total || 0
            });
        }
        
        // Top selling items (all time)
        const topItems = await Order.aggregate([
            { $unwind: '$items' },
            { $group: {
                _id: '$items.name',
                totalQuantity: { $sum: '$items.quantity' },
                totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }},
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 }
        ]);
        
        // Orders by area
        const ordersByArea = await Order.aggregate([
            { $group: {
                _id: '$delivery.area',
                count: { $sum: 1 },
                revenue: { $sum: '$total' }
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        res.json({
            success: true,
            todayOrders: todayOrders.length,
            pendingOrders,
            todayRevenue