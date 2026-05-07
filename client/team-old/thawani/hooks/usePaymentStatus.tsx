import { useState } from 'react';

interface UsePaymentStatusProps {
    paymentStatus: string | null;
    loading: boolean;
    error: string | null;
    checkStatusPaymentSession: (sessionId: string) => void;
    stopChecking: () => void;
    resetStatus: () => void;
}

export const usePaymentStatus = (): UsePaymentStatusProps => {
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

    const checkStatusPaymentSession = (sessionId: string): void => {
        setLoading(true);
        setError(null);

        const fetchPaymentStatus = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_THAWANI_API}/checkout/session/${sessionId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'thawani-api-key': process.env.NEXT_PUBLIC_THAWANI_SECRET_KEY || '',
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    setPaymentStatus(data?.data.payment_status);
                    console.log('Payment status:', data?.data.payment_status);

                    if (data?.data.payment_status === 'paid') {
                        stopChecking(); // Stop checking if payment is confirmed
                    }
                } else {
                    throw new Error(data.message || 'Error fetching payment status');
                }
            } catch (err: any) {
                setError(err.message);
                stopChecking(); // Stop checking if an error occurs
            } finally {
                setLoading(false);
            }
        };

        if (!intervalId) {
            const newIntervalId = setInterval(fetchPaymentStatus, 5000); // Poll every 5 seconds
            setIntervalId(newIntervalId);
        }
    };

    const stopChecking = () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };

    const resetStatus = () => {
        setPaymentStatus(null);
        setError(null);
    };

    return { paymentStatus, loading, error, checkStatusPaymentSession, stopChecking, resetStatus };
};
