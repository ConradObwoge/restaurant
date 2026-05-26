const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['admin', 'staff', 'rider'], 
        default: 'staff' 
    },
    phone: { 
        type: String, 
        default: '' 
    },
    lastLogin: { 
        type: Date 
    },
    active: { 
        type: Boolean, 
        default: true 
    }
}, {
    timestamps: true
});

// Hash password before saving (only if modified)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from JSON responses
userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);