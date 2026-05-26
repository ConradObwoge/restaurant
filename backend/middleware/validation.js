const { body, validationResult } = require('express-validator');

// Validation rules for orders
const validateOrder = [
    body('customer.name')
        .notEmpty().withMessage('Name is required')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    
    body('customer.phone')
        .notEmpty().withMessage('Phone number is required')
        .isMobilePhone('any').withMessage('Valid phone number required')
        .matches(/^[0-9]{10,12}$/).withMessage('Phone must be 10-12 digits'),
    
    body('delivery.area')
        .notEmpty().withMessage('Delivery area is required')
        .trim(),
    
    body('items')
        .isArray({ min: 1 }).withMessage('At least one item required'),
    
    body('items.*.name')
        .notEmpty().withMessage('Item name required'),
    
    body('items.*.price')
        .isNumeric().withMessage('Price must be a number')
        .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
    
    body('items.*.quantity')
        .isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99'),
    
    body('payment.method')
        .isIn(['cash', 'mpesa']).withMessage('Invalid payment method'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        next();
    }
];

// Validation rules for login
const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email required')
        .isEmail().withMessage('Valid email required')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password required')
        .isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }
        next();
    }
];

// Sanitize phone number (remove +254, 0, spaces)
function sanitizePhone(phone) {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('+254')) {
        cleaned = '0' + cleaned.slice(4);
    }
    if (cleaned.startsWith('254') && !cleaned.startsWith('0')) {
        cleaned = '0' + cleaned.slice(3);
    }
    return cleaned;
}

module.exports = { validateOrder, validateLogin, sanitizePhone };