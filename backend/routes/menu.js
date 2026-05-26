const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { authenticateToken } = require('../middleware/auth');

// GET - All menu items (public)
router.get('/', async (req, res) => {
    try {
        const items = await MenuItem.find({ available: true }).sort({ order: 1, name: 1 });
        
        // Group by category
        const grouped = {
            grill: { title: '🔥 Nyama Choma & Grills', items: [] },
            meals: { title: '🍛 Meals & Ugali', items: [] },
            drinks: { title: '🥤 Drinks', items: [] },
            extras: { title: '➕ Extras', items: [] }
        };
        
        items.forEach(item => {
            if (grouped[item.category]) {
                grouped[item.category].items.push(item);
            }
        });
        
        // Remove empty categories
        Object.keys(grouped).forEach(key => {
            if (grouped[key].items.length === 0) {
                delete grouped[key];
            }
        });
        
        res.json({ success: true, menu: grouped });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to fetch menu' });
    }
});

// GET - Popular items (public)
router.get('/popular', async (req, res) => {
    try {
        const items = await MenuItem.find({ available: true, popular: true }).limit(6);
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch popular items' });
    }
});

// POST - Add menu item (protected - admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        
        const menuItem = new MenuItem(req.body);
        await menuItem.save();
        res.status(201).json({ success: true, menuItem });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add menu item' });
    }
});

// PUT - Update menu item (protected - admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        
        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!menuItem) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }
        
        res.json({ success: true, menuItem });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update menu item' });
    }
});

// DELETE - Delete menu item (protected - admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ success: false, error: 'Menu item not found' });
        }
        
        res.json({ success: true, message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete menu item' });
    }
});

module.exports = router;