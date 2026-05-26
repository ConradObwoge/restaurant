const axios = require('axios');

async function sendWhatsAppNotification(order) {
    try {
        const restaurantNumber = process.env.WHATSAPP_NUMBER || '254706908041';
        
        // Format order items
        const itemsList = order.items.map(item => 
            `• ${item.name} x${item.quantity} = KES ${item.price * item.quantity}`
        ).join('%0A');
        
        const message = `🆕 *NEW ORDER #${order.orderNumber}*%0A%0A` +
            `👤 *Customer:* ${order.customer.name}%0A` +
            `📞 *Phone:* ${order.customer.phone}%0A` +
            `📍 *Area:* ${order.delivery.area}%0A` +
            `🚚 *Delivery Fee:* KES ${order.deliveryFee}%0A%0A` +
            `*📦 ITEMS:*%0A${itemsList}%0A%0A` +
            `💰 *Subtotal:* KES ${order.subtotal}%0A` +
            `💰 *Total:* KES ${order.total}%0A` +
            `💳 *Payment:* ${order.payment.method === 'mpesa' ? 'M-Pesa' : 'Cash on delivery'}%0A%0A` +
            `🕐 *Time:* ${new Date(order.createdAt).toLocaleString()}%0A%0A` +
            `✅ *Action:* Login to admin panel to confirm this order.%0A` +
            `🔗 ${process.env.ADMIN_URL || 'http://localhost:5000/admin/dashboard.html'}`;
        
        // Using CallMeBot API (free WhatsApp API)
        const url = `https://api.callmebot.com/whatsapp.php?phone=${restaurantNumber}&text=${message}&apikey=${process.env.CALLMEBOT_API_KEY || 'YOUR_API_KEY'}`;
        
        // Uncomment to actually send
        // await axios.get(url);
        
        console.log('📱 WhatsApp notification prepared for:', restaurantNumber);
        console.log('Message:', message.replace(/%0A/g, '\n'));
        
        // Also send SMS fallback (optional)
        await sendSmsFallback(order);
        
        return true;
        
    } catch (error) {
        console.error('WhatsApp notification failed:', error.message);
        return false;
    }
}

// SMS fallback (using Africa's Talking or similar)
async function sendSmsFallback(order) {
    try {
        // Example using Africa's Talking - uncomment and add API keys
        /*
        const Africastalking = require('africastalking');
        const africasTalking = Africastalking({
            apiKey: process.env.AT_API_KEY,
            username: process.env.AT_USERNAME
        });
        
        await africasTalking.SMS.send({
            to: order.customer.phone,
            message: `Maakaso Kitchen: Order #${order.orderNumber} received. Total KES ${order.total}. We'll call you shortly.`
        });
        */
        
        console.log('📱 SMS would be sent to:', order.customer.phone);
        return true;
    } catch (error) {
        console.error('SMS failed:', error.message);
        return false;
    }
}

// Send order confirmation to customer
async function sendCustomerConfirmation(order) {
    try {
        const message = `✅ *Maakaso Kitchen*%0A` +
            `Order #${order.orderNumber} confirmed!%0A` +
            `Total: KES ${order.total}%0A` +
            `Delivery to: ${order.delivery.area}%0A` +
            `Est. time: 30-45 min%0A%0A` +
            `Thank you for ordering from us!`;
        
        const url = `https://api.callmebot.com/whatsapp.php?phone=${order.customer.phone}&text=${message}&apikey=${process.env.CALLMEBOT_API_KEY}`;
        
        // Uncomment to send
        // await axios.get(url);
        
        console.log('📱 Customer confirmation sent to:', order.customer.phone);
        return true;
    } catch (error) {
        console.error('Customer notification failed:', error.message);
        return false;
    }
}

module.exports = { sendWhatsAppNotification, sendCustomerConfirmation };