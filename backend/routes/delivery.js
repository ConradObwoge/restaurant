const express = require('express');
const router = express.Router();
const DeliveryZone = require('../models/DeliveryZone');

// GET - All delivery zones (public)
router.get('/zones', async (req, res) => {
    try {
        const zones = await DeliveryZone.find({ active: true }).sort({ fee: 1 });
        res.json({ 
            success: true, 
            zones,
            message: 'Areas where Glovo does NOT reach are highlighted'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch zones' });
    }
});

// POST - Calculate delivery fee (public)
router.post('/calculate', async (req, res) => {
    try {
        const { area, subtotal } = req.body;
        
        if (!area) {
            return res.status(400).json({ success: false, error: 'Area required' });
        }
        
        const zone = await DeliveryZone.findOne({ 
            name: { $regex: new RegExp(`^${area}$`, 'i') },
            active: true 
        });
        
        let fee = 200; // Default fee
        let available = true;
        let estimatedTime = '30-45 min';
        let glovoAvailable = false;
        
        if (zone) {
            fee = zone.fee;
            available = true;
            estimatedTime = zone.estimatedTime;
            glovoAvailable = zone.glovoAvailable;
        }
        
        // Free delivery for orders over KES 1000 in Machakos Town
        const minFreeDelivery = 1000;
        if (area === 'Machakos Town' && subtotal >= minFreeDelivery) {
            fee = 0;
        }
        
        res.json({
            success: true,
            area,
            fee,
            available,
            estimatedTime,
            glovoAvailable,
            freeDeliveryEligible: subtotal >= minFreeDelivery && area === 'Machakos Town',
            minimumForFree: minFreeDelivery
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to calculate fee' });
    }
});

// POST - Add delivery zone (protected - admin only)
router.post('/zones', async (req, res) => {
    try {
        // In production, add authenticateToken and authorizeAdmin middleware
        const zone = new DeliveryZone(req.body);
        await zone.save();
        res.status(201).json({ success: true, zone });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add zone' });
    }
});

module.exports = router;