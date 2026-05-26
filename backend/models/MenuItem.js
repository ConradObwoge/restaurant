const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true,
        unique: true
    },
    category: { 
        type: String, 
        enum: ['grill', 'meals', 'drinks', 'extras'],
        required: true 
    },
    categoryDisplay: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    description: { 
        type: String, 
        default: '' 
    },
    image: { 
        type: String, 
        default: '' 
    },
    available: { 
        type: Boolean, 
        default: true 
    },
    popular: { 
        type: Boolean, 
        default: false 
    },
    order: { 
        type: Number, 
        default: 0 
    }
}, {
    timestamps: true
});

// Index for faster category queries
menuItemSchema.index({ category: 1, available: 1 });
menuItemSchema.index({ popular: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);