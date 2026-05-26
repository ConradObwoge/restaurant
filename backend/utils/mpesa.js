const axios = require('axios');

// M-Pesa STK Push (Lipa Na M-Pesa Online)
async function initiateMpesaPayment(order) {
    try {
        // Check if M-Pesa is enabled
        if (process.env.MPESA_ENVIRONMENT !== 'production') {
            console.log('💳 M-Pesa in sandbox mode - not actually charging');
            return {
                success: true,
                message: 'M-Pesa payment simulated',
                checkoutRequestID: 'SIMULATED_' + Date.now()
            };
        }
        
        const timestamp = getMpesaTimestamp();
        const password = Buffer.from(
            `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
        ).toString('base64');
        
        const requestBody = {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(order.total),
            PartyA: order.customer.phone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: order.customer.phone,
            CallBackURL: `${process.env.CALLBACK_URL}/api/mpesa/callback`,
            AccountReference: order.orderNumber,
            TransactionDesc: `Food order ${order.orderNumber}`
        };
        
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64');
        
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            requestBody,
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data.ResponseCode === '0') {
            return {
                success: true,
                checkoutRequestID: response.data.CheckoutRequestID,
                message: 'M-Pesa payment initiated. Check your phone for prompt.'
            };
        } else {
            return {
                success: false,
                error: response.data.ResponseDescription
            };
        }
        
    } catch (error) {
        console.error('M-Pesa error:', error.response?.data || error.message);
        return {
            success: false,
            error: 'M-Pesa payment failed. Please try again or use cash on delivery.'
        };
    }
}

function getMpesaTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Query M-Pesa transaction status
async function queryMpesaStatus(checkoutRequestID) {
    try {
        const timestamp = getMpesaTimestamp();
        const password = Buffer.from(
            `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
        ).toString('base64');
        
        const auth = Buffer.from(
            `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
        ).toString('base64');
        
        const response = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
            {
                BusinessShortCode: process.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID
            },
            {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return {
            success: response.data.ResultCode === '0',
            status: response.data.ResultDesc,
            receiptNumber: response.data.MpesaReceiptNumber
        };
    } catch (error) {
        console.error('M-Pesa query error:', error.message);
        return { success: false, error: 'Failed to query payment status' };
    }
}

module.exports = { initiateMpesaPayment, queryMpesaStatus };