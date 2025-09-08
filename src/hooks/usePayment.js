import { useState } from 'react';
import { 
  loadRazorpayScript, 
  createRazorpayOrder, 
  getRazorpayOptions,
  calculateIndividualAmount,
  calculateTeamAmount,
  isRazorpayConfigured 
} from '../lib/razorpay';

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const processIndividualPayment = async (eventData, userDetails, memberDiscount = 0) => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Calculate amount
      const amount = calculateIndividualAmount(eventData.price, memberDiscount);
      
      // Create order
      const orderResult = await createRazorpayOrder(
        amount, 
        'INR', 
        `individual_${eventData.id}_${Date.now()}`
      );
      
      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Return promise that resolves when payment is complete
      return new Promise((resolve, reject) => {
        const options = getRazorpayOptions(
          orderResult.order,
          userDetails,
          (paymentResponse) => {
            setIsProcessing(false);
            resolve({
              success: true,
              paymentData: {
                ...paymentResponse,
                amount: amount / 100, // Convert back to rupees
                type: 'individual'
              }
            });
          },
          (error) => {
            setIsProcessing(false);
            setPaymentError(error);
            reject({ success: false, error });
          }
        );

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });

    } catch (error) {
      setIsProcessing(false);
      setPaymentError(error.message);
      return { success: false, error: error.message };
    }
  };

  const processTeamPayment = async (eventData, teamLeaderDetails, teamMembers, memberDiscount = 0) => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Calculate total amount (including team leader)
      const totalMembers = teamMembers.length + 1;
      const amount = calculateTeamAmount(totalMembers, eventData.price, memberDiscount);
      
      // Create order
      const orderResult = await createRazorpayOrder(
        amount, 
        'INR', 
        `team_${eventData.id}_${Date.now()}`
      );
      
      if (!orderResult.success) {
        throw new Error(orderResult.error);
      }

      // Return promise that resolves when payment is complete
      return new Promise((resolve, reject) => {
        const options = getRazorpayOptions(
          orderResult.order,
          {
            ...teamLeaderDetails,
            name: `${teamLeaderDetails.name} (Team Leader)`
          },
          (paymentResponse) => {
            setIsProcessing(false);
            resolve({
              success: true,
              paymentData: {
                ...paymentResponse,
                amount: amount / 100, // Convert back to rupees
                totalMembers,
                type: 'team'
              }
            });
          },
          (error) => {
            setIsProcessing(false);
            setPaymentError(error);
            reject({ success: false, error });
          }
        );

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      });

    } catch (error) {
      setIsProcessing(false);
      setPaymentError(error.message);
      return { success: false, error: error.message };
    }
  };

  const processPaymentFallback = async (eventData, userDetails, isTeam = false, teamMembers = []) => {
    // Fallback for when Razorpay is not configured
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    
    return {
      success: true,
      paymentData: {
        paymentId: `demo_payment_${Date.now()}`,
        orderId: `demo_order_${Date.now()}`,
        amount: isTeam ? 
          (teamMembers.length + 1) * parseFloat(eventData.price.replace(/[₹$,]/g, '')) :
          parseFloat(eventData.price.replace(/[₹$,]/g, '')),
        type: isTeam ? 'team' : 'individual',
        status: 'demo_success'
      }
    };
  };

  return {
    processIndividualPayment,
    processTeamPayment,
    processPaymentFallback,
    isProcessing,
    paymentError,
    isRazorpayConfigured: isRazorpayConfigured()
  };
};