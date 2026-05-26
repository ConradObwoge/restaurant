require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const MenuItem = require('./models/MenuItem');
const DeliveryZone = require('./models/DeliveryZone');
const User = require('./models/User');
const Order = require('./models/Order');

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await MenuItem.deleteMany({});
        await DeliveryZone.deleteMany({});
        await User.deleteMany({});
        await Order.deleteMany({});
        console.log('Cleared existing collections');

        // ========== INSERT MENU ITEMS ==========
        const menuItems = [
            // Grills
            { name: 'Grilled Chicken (1/4)', category: 'grill', categoryDisplay: '🔥 Nyama Choma & Grills', price: 350, description: 'With kachumbari & sukuma', available: true, popular: true, order: 1 },
            { name: 'Nyama Choma (250g)', category: 'grill', categoryDisplay: '🔥 Nyama Choma & Grills', price: 400, description: 'Goat meat, served with kachumbari', available: true, popular: true, order: 2 },
            { name: 'Pilau + Chicken', category: 'grill', categoryDisplay: '🔥 Nyama Choma & Grills', price: 350, description: 'Spiced rice with chicken stew', available: true, popular: false, order: 3 },
            { name: 'Mshikaki (4pcs)', category: 'grill', categoryDisplay: '🔥 Nyama Choma & Grills', price: 450, description: 'Beef skewers with peppers', available: true, popular: false, order: 4 },
            
            // Meals
            { name: 'Ugali + Beef Stew', category: 'meals', categoryDisplay: '🍛 Meals & Ugali', price: 250, description: 'Hearty portion', available: true, popular: true, order: 1 },
            { name: 'Ugali + Fried Fish', category: 'meals', categoryDisplay: '🍛 Meals & Ugali', price: 350, description: 'Whole tilapia', available: true, popular: false, order: 2 },
            { name: 'Chips + Sausage', category: 'meals', categoryDisplay: '🍛 Meals & Ugali', price: 200, description: 'With tomato sauce', available: true, popular: false, order: 3 },
            { name: 'Chips + Chicken', category: 'meals', categoryDisplay: '🍛 Meals & Ugali', price: 350, description: 'Fried chicken & chips', available: true, popular: true, order: 4 },
            { name: 'Rice + Beef Stew', category: 'meals', categoryDisplay: '🍛 Meals & Ugali', price: 250, description: 'White rice with beef stew', available: true, popular: false, order: 5 },
            { name: 'Matumbo (Tripe)', category: 'meals', categoryDisplay: '🍛 Meals & Ugali', price: 300, description: 'With ugali or rice', available: true, popular: false, order: 6 },
            
            // Drinks
            { name: 'Soda (Pepsi/Kasi)', category: 'drinks', categoryDisplay: '🥤 Drinks', price: 100, description: '500ml bottle', available: true, popular: true, order: 1 },
            { name: 'Fresh Mango Juice', category: 'drinks', categoryDisplay: '🥤 Drinks', price: 150, description: 'Freshly squeezed', available: true, popular: true, order: 2 },
            { name: 'Mineral Water', category: 'drinks', categoryDisplay: '🥤 Drinks', price: 80, description: '500ml', available: true, popular: false, order: 3 },
            { name: 'Pineapple Juice', category: 'drinks', categoryDisplay: '🥤 Drinks', price: 150, description: 'Freshly squeezed', available: true, popular: false, order: 4 },
            { name: 'Passion Juice', category: 'drinks', categoryDisplay: '🥤 Drinks', price: 150, description: 'Freshly squeezed', available: true, popular: false, order: 5 },
            { name: 'Chai (Tea)', category: 'drinks', categoryDisplay: '🥤 Drinks', price: 70, description: 'Hot milky tea', available: true, popular: false, order: 6 },
        ];

        await MenuItem.insertMany(menuItems);
        console.log(`✅ Inserted ${menuItems.length} menu items`);

        // ========== INSERT DELIVERY ZONES ==========
        const zones = [
            { name: 'Machakos Town', fee: 0, glovoAvailable: true, estimatedTime: '15-20 min', active: true },
            { name: 'Kyumbi', fee: 100, glovoAvailable: false, estimatedTime: '30-40 min', active: true },
            { name: 'Mua Hills', fee: 100, glovoAvailable: false, estimatedTime: '35-45 min', active: true },
            { name: 'Kola', fee: 120, glovoAvailable: false, estimatedTime: '40-50 min', active: true },
            { name: 'Joska', fee: 150, glovoAvailable: false, estimatedTime: '45-60 min', active: true },
            { name: 'Kangundo Road', fee: 200, glovoAvailable: false, estimatedTime: '50-70 min', active: true },
            { name: 'Machakos Junction', fee: 0, glovoAvailable: true, estimatedTime: '10-15 min', active: true },
        ];

        await DeliveryZone.insertMany(zones);
        console.log(`✅ Inserted ${zones.length} delivery zones`);

        // ========== CREATE ADMIN USER ==========
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        const admin = new User({
            email: process.env.ADMIN_EMAIL || 'manager@maakasokitchen.co.ke',
            password: hashedPassword,
            name: 'Restaurant Manager',
            role: 'admin'
        });
        await admin.save();
        console.log(`✅ Admin user created: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);

        // ========== CREATE SAMPLE ORDER (for testing) ==========
        const sampleOrder = new Order({
            customer: {
                name: 'Test Customer',
                phone: '0712345678'
            },
            delivery: {
                area: 'Machakos Town',
                fee: 0,
                address: 'Opposite Machakos University'
            },
            items: [
                { name: 'Nyama Choma (250g)', price: 400, quantity: 2 },
                { name: 'Ugali + Beef Stew', price: 250, quantity: 1 }
            ],
            subtotal: 1050,
            deliveryFee: 0,
            total: 1050,
            payment: {
                method: 'cash',
                status: 'pending'
            },
            status: 'delivered',
            notes: 'Sample order for testing'
        });
        await sampleOrder.save();
        console.log('✅ Sample order created for testing');

        console.log('\n🎉 DATABASE SEED COMPLETE! 🎉');
        console.log('\n📋 Summary:');
        console.log(`   - Menu items: ${menuItems.length}`);
        console.log(`   - Delivery zones: ${zones.length}`);
        console.log(`   - Admin user: ${admin.email}`);
        console.log(`   - Sample order: ${sampleOrder.orderNumber}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedDatabase();