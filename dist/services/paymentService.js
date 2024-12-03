"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
class PaymentService {
    constructor() {
        this.paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
    }
    getPaystackConfig(config) {
        return {
            publicKey: this.paystackPublicKey,
            amount: config.amount * 100, // Convert to kobo
            email: config.email,
            reference: config.reference,
            currency: 'NGN',
            channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        };
    }
    async validatePayment(reference) {
        try {
            const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            return data.status && data.data.status === 'success';
        }
        catch (error) {
            console.error('Payment validation error:', error);
            return false;
        }
    }
}
exports.paymentService = new PaymentService();
