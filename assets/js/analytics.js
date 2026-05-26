let revenueChart, ordersChart, topItemsChart, areaChart;
let token = localStorage.getItem('admin_token');

if (!token) {
    window.location.href = 'login.html';
}

// Set default dates
function setDateRange(range) {
    const today = new Date();
    const endDate = new Date();
    let startDate = new Date();
    
    switch(range) {
        case 'today':
            startDate = today;
            break;
        case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
    }
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    loadAnalytics();
}

async function loadAnalytics() {
    let startDate = document.getElementById('startDate').value;
    let endDate = document.getElementById('endDate').value;
    
    let url = '/api/admin/analytics';
    if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('admin_token');
                window.location.href = 'login.html';
            }
            throw new Error('Failed to load analytics');
        }
        
        const data = await response.json();
        updateStats(data);
        updateCharts(data);
        updateTopItems(data.topItems);
        updatePaymentStats(data.paymentStats);
        
    } catch (error) {
        console.error(error);
        document.getElementById('orders-list').innerHTML = '<p>Error loading analytics</p>';
    }
}

function updateStats(data) {
    document.getElementById('totalRevenue').innerText = `KES ${data.totalRevenue.toLocaleString()}`;
    document.getElementById('totalOrders').innerText = data.totalOrders;
    document.getElementById('avgOrder').innerText = `KES ${Math.round(data.avgOrderValue).toLocaleString()}`;
    
    if (data.topArea) {
        document.getElementById('topArea').innerText = data.topArea;
    }
    
    if (data.revenueChange) {
        document.getElementById('revenueChange').innerHTML = data.revenueChange > 0 ? 
            `↑ ${data.revenueChange}% from previous` : `↓ ${Math.abs(data.revenueChange)}% from previous`;
    }
    
    if (data.ordersChange) {
        document.getElementById('ordersChange').innerHTML = data.ordersChange > 0 ? 
            `↑ ${data.ordersChange}% from previous` : `↓ ${Math.abs(data.ordersChange)}% from previous`;
    }
}

function updateCharts(data) {
    // Revenue Chart
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: data.chartLabels,
            datasets: [{
                label: 'Revenue (KES)',
                data: data.revenueData,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Orders Chart
    if (ordersChart) ordersChart.destroy();
    ordersChart = new Chart(document.getElementById('ordersChart'), {
        type: 'bar',
        data: {
            labels: data.chartLabels,
            datasets: [{
                label: 'Number of Orders',
                data: data.ordersData,
                backgroundColor: '#c0392b'
            }]
        },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    // Top Items Chart
    if (topItemsChart) topItemsChart.destroy();
    if (data.topItems && data.topItems.length > 0) {
        topItemsChart = new Chart(document.getElementById('topItemsChart'), {
            type: 'pie',
            data: {
                labels: data.topItems.map(i => i.name),
                datasets: [{
                    data: data.topItems.map(i => i.totalQuantity),
                    backgroundColor: ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#3498db']
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
    
    // Area Chart
    if (areaChart) areaChart.destroy();
    if (data.areaStats && data.areaStats.length > 0) {
        areaChart = new Chart(document.getElementById('areaChart'), {
            type: 'doughnut',
            data: {
                labels: data.areaStats.map(a => a.area),
                datasets: [{
                    data: data.areaStats.map(a => a.count),
                    backgroundColor: ['#2c3e50', '#c0392b', '#e67e22', '#27ae60', '#3498db']
                }]
            },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
}

function updateTopItems(items) {
    const container = document.getElementById('topItemsList');
    if (!items || items.length === 0) {
        container.innerHTML = '<p>No data available</p>';
        return;
    }
    
    container.innerHTML = items.map((item, index) => `
        <div class="item-row">
            <span>${index + 1}. ${item.name}</span>
            <span>${item.totalQuantity} sold • KES ${item.totalRevenue.toLocaleString()}</span>
        </div>
    `).join('');
}

function updatePaymentStats(stats) {
    const container = document.getElementById('paymentStats');
    if (!stats) return;
    
    container.innerHTML = `
        <div class="payment-stat">
            <strong>💵 Cash</strong>
            <p>${stats.cash.count} orders</p>
            <p>KES ${stats.cash.total.toLocaleString()}</p>
        </div>
        <div class="payment-stat">
            <strong>📱 M-Pesa</strong>
            <p>${stats.mpesa.count} orders</p>
            <p>KES ${stats.mpesa.total.toLocaleString()}</p>
        </div>
    `;
}

function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = 'login.html';
}

// Initialize
document.getElementById('startDate').value = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];
document.getElementById('endDate').value = new Date().toISOString().split('T')[0];
loadAnalytics();