import axios from "axios";

export const initializePaystackPayment = async ({
  email,
  amount,
  callback_url,
  reference,
}) => {
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack uses kobo, so multiply by 100
        callback_url,
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data; // Contains authorization_url, access_code, reference
  } catch (error) {
    console.error(
      "Paystack Init Error:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || "Paystack init failed");
  }
};
