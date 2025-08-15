import crypto from 'crypto';
import Booking from "../models/Booking.js";
import paystack from "paystack";

// Initialize Paystack
const paystackInstance = new paystack(process.env.PAYSTACK_SECRET_KEY);

// Verify Paystack webhook signature
const verifyPaystackWebhook = async (req, res) => {
  try {
    // Get the signature from the header
    const signature = req.headers['x-paystack-signature'];
    
    if (!signature) {
      return res.status(400).json({ success: false, message: 'No signature provided' });
    }

    // Get the webhook secret from environment
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    // Create a hash using the secret and the request body
    const hash = crypto.createHmac('sha512', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    // Verify the signature
    if (hash !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Process the webhook event
    const { event, data } = req.body;
    
    if (event === 'charge.success') {
      // Find the booking by reference
      const booking = await Booking.findOne({ reference: data.reference });
      
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Update booking status
      await Booking.findByIdAndUpdate(booking._id, {
        paymentStatus: 'paid',
        paymentMethod: 'Paystack',
        paymentAmount: data.amount / 100, // Convert from kobo to GHS
        currency: data.currency,
        paymentReference: data.reference
      });
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// API to handle Paystack Webhooks
// POST /api/paystack-webhook
export const paystackWebhooks = async (request, response) => {
  try {
    const { event } = request.body;

    // Verify the event
    if (event.eventType === "charge.success") {
      const { reference } = event.data;

      // Find the booking associated with this reference
      const booking = await Booking.findOne({ reference });

      if (booking) {
        // Mark Payment as Paid
        await Booking.findByIdAndUpdate(booking._id, {
          isPaid: true,
          paymentMethod: "Paystack"
        });

        // Verify payment with Paystack
        const verification = await paystackInstance.transaction.verify(reference);
        
        if (verification.status === "success") {
          // Update booking with payment details
          await Booking.findByIdAndUpdate(booking._id, {
            paymentStatus: verification.status,
            paymentReference: verification.reference,
            paymentAmount: verification.amount / 100, // Convert from kobo to currency
            paymentCurrency: verification.currency
          });

          // Send success response to Paystack
          response.status(200).json({ status: "success" });
        } else {
          console.log("Payment verification failed:", verification.message);
          response.status(400).json({ status: "error", message: "Payment verification failed" });
        }
      } else {
        console.log("Booking not found for reference:", reference);
        response.status(404).json({ status: "error", message: "Booking not found" });
      }
    } else if (event.eventType === "charge.failed") {
      // Handle failed payments
      const { reference } = event.data;
      const booking = await Booking.findOne({ reference });
      
      if (booking) {
        await Booking.findByIdAndUpdate(booking._id, {
          paymentStatus: "failed",
          paymentMethod: "Paystack"
        });
      }
      
      response.status(200).json({ status: "success" });
    } else {
      console.log("Unhandled event type:", event.eventType);
      response.status(200).json({ status: "success" });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    response.status(400).json({ status: "error", message: error.message });
  }
};

export { verifyPaystackWebhook };
