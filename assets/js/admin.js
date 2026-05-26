let currentFilter = 'all';
let allOrders = [];

function loadOrders() {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    allOrders = orders.map((order, index) => ({ ...order, id: index + 1, status: order.status || 'pending' }));
    
    // Update stats
    let today = new Date().toDateString();
    let todayOrders = allOrders.filter(o => new Date(o.timestamp).toDateString() === today);
    document.getElementById('todayCount').innerText = todayOrders.length;
    document.getElementById('pendingCount').innerText = allOrders.filter(o => o.status === 'pending').length;
    
    let todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('todayRevenue').innerText = `KES ${todayRevenue}`;
    
    renderOrders();
}

function renderOrders() {
    let filtered = currentFilter === 'all' ? allOrders : allOrders.filter(o => o.status === currentFilter);
    let html = '';
    
    filtered.reverse().forEach(order => {
        html += `
            <div class="order-card" data-status="${order.status}">
                <div class="order-header">
                    <strong>Order #${order.id}</strong>
                    <span class="status ${order.status}">${order.status}</span>
                </div>
                <p>👤 ${order.name} | 📞 ${order.phone}</p>
                <p>📍 ${order.area} | 🚚 Delivery: KES ${order.delivery_fee || 0}</p>
                <div class="items">
                    ${order.cart.map(i => `${i.name} x${i.quantity} = KES ${i.price * i.quantity}`).join('<br>')}
                </div>
                <p class="total" style="font-weight:bold; margin-top:8px;">💰 TOTAL: KES ${order.total}</p>
                <p>💳 ${order.payment === 'mpesa' ? 'M-Pesa' : 'Cash on delivery'}</p>
                <p>🕐 ${new Date(order.timestamp).toLocaleString()}</p>
                <div class="actions">
                    <button onclick="updateStatus(${order.id}, 'preparing')">🍳 Start Preparing</button>
                    <button onclick="updateStatus(${order.id}, 'delivered')">✅ Mark Delivered</button>
                </div>
            </div>
        `;
    });
    
    if (filtered.length === 0) {
        html = '<p style="text-align:center; padding:40px;">No orders found.</p>';
    }
    
    document.getElementById('orders-list').innerHTML = html;
}

function updateStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    let order = orders[orderId - 1];
    if (order) {
        order.status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        loadOrders();
    }
}

function filterOrders(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderOrders();
}

function logout() {
    localStorage.removeItem('admin_logged_in');
    window.location.href = 'login.html';
}

// Check auth
if (localStorage.getItem('admin_logged_in') !== 'true') {
    window.location.href = 'login.html';
}

loadOrders();
setInterval(loadOrders, 15000); // Auto-refresh every 15 seconds