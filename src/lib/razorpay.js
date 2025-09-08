// Razorpay configuration and utilities

// Check if Razorpay is properly configured
export const isRazorpayConfigured = () => {
  const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
  const keySecret = process.env.REACT_APP_RAZORPAY_KEY_SECRET;
  
  return keyId && keySecret && 
    keyId !== 'YOUR_RAZORPAY_KEY_ID' && 
    keySecret !== 'YOUR_RAZORPAY_KEY_SECRET';
};

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const existingScript = document.getElementById('razorpay-script');
    
    if (existingScript) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    
    document.body.appendChild(script);
  });
};

// Calculate total amount for team registration (each member pays full fee)
export const calculateTeamAmount = (memberCount, pricePerMember, memberDiscount = 0) => {
  const numericPrice = typeof pricePerMember === 'string' ? 
    parseFloat(pricePerMember.replace(/[₹$,]/g, '')) : pricePerMember;
  
  const baseAmount = numericPrice * memberCount; // Each member pays full fee
  const discountAmount = baseAmount * memberDiscount;
  const finalAmount = baseAmount - discountAmount;
  
  return Math.round(finalAmount * 100); // Convert to paise
};

// Get formatted price for display
export const formatPrice = (price) => {
  const numericPrice = typeof price === 'string' ? 
    parseFloat(price.replace(/[₹$,]/g, '')) : price;
  
  return `₹${numericPrice.toFixed(0)}`;
};

// Calculate display amount (in rupees, not paise)
export const calculateDisplayAmount = (memberCount, pricePerMember, isTeam = false) => {
  const numericPrice = typeof pricePerMember === 'string' ? 
    parseFloat(pricePerMember.replace(/[₹$,]/g, '')) : pricePerMember;
  
  if (isTeam) {
    return numericPrice * memberCount; // Each member pays full fee
  } else {
    return numericPrice; // Individual registration
  }
};

// Calculate amount for individual registration
export const calculateIndividualAmount = (price, memberDiscount = 0) => {
  const numericPrice = typeof price === 'string' ? 
    parseFloat(price.replace(/[₹$,]/g, '')) : price;
  
  const discountAmount = numericPrice * memberDiscount;
  return Math.round((numericPrice - discountAmount) * 100); // Convert to paise
};

// Create Razorpay order
export const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
  try {
    // In a real app, this would call your backend API
    // For now, we'll simulate order creation
    const order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`
    };
    
    return { success: true, order };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Razorpay payment options
export const getRazorpayOptions = (order, userDetails, onSuccess, onFailure) => {
  return {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_demo_key',
    amount: order.amount,
    currency: order.currency,
    name: 'Tech Club Events',
    description: 'Event Registration Payment',
    order_id: order.id,
    handler: function (response) {
      onSuccess({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature
      });
    },
    prefill: {
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.phone
    },
    notes: {
      address: userDetails.address || 'Tech Club'
    },
    theme: {
      color: '#667eea'
    },
    modal: {
      ondismiss: function() {
        onFailure('Payment cancelled by user');
      }
    }
  };
};