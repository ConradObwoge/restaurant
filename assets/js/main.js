let cart = [];

function updateCartUI() {
    let count = cart.reduce((sum, i) => sum + i.quantity, 0);
    let total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    document.getElementById('cart-count').innerText = count;
    document.getElementById('cart-total').innerText = `KES ${total}`;
}

function addToCart(name, price) {
    let existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartUI();
    alert(`✅ ${name} added to cart`);
}

document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const itemDiv = e.target.closest('.menu-item');
        const name = itemDiv.getAttribute('data-name');
        const price = parseInt(itemDiv.getAttribute('data-price'));
        addToCart(name, price);
    });
});

document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Your cart is empty. Add some food first!");
        return;
    }

    let customerName = document.getElementById('customer-name').value;
    let phone = document.getElementById('customer-phone').value;
    let area = document.getElementById('delivery-area').value;
    let payment = document.querySelector('input[name="payment"]:checked').value;

    if (!customerName || !phone || !area) {
        alert("Please fill in your name, phone number, and delivery area");
        return;
    }

    if (phone.length < 10) {
        alert("Please enter a valid phone number (e.g., 0712345678)");
        return;
    }

    let total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    // Add delivery fee
    let deliveryFee = 0;
    if (area === "Kyumbi" || area === "Mua Hills") deliveryFee = 100;
    else if (area === "Kola") deliveryFee = 120;
    else if (area === "Joska") deliveryFee = 150;
    
    total += deliveryFee;

    let order = {
        name: customerName,
        phone: phone,
        area: area,
        cart: cart,
        subtotal: total - deliveryFee,
        delivery_fee: deliveryFee,
        total: total,
        payment: payment,
        timestamp: new Date().toISOString()
    };

    // Save to localStorage as fallback
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Prepare order summary
    let summary = `🍽️ NEW ORDER FROM ${customerName}\n📞 ${phone}\n📍 ${area}\n`;
    cart.forEach(item => {
        summary += `• ${item.name} x${item.quantity} = KES ${item.price * item.quantity}\n`;
    });
    summary += `🚚 Delivery: KES ${deliveryFee}\n`;
    summary += `💰 TOTAL: KES ${total}\n`;
    summary += `💳 Payment: ${payment === 'mpesa' ? 'M-Pesa Till 123456' : 'Cash on delivery'}\n\n`;
    summary += `✅ Order saved. Restaurant will call you within 10 minutes.`;

    alert(summary);

    // Reset cart and form
    cart = [];
    updateCartUI();
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.getElementById('delivery-area').value = '';
});