import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { usePaymentStatus } from '../../thawani/index'; // Adjust the path accordingly
import { LoadingOverlay, Box } from '@mantine/core';

export default function PaymentSuccess() {
    const router = useRouter();
    const { session_id } = router.query;
    const { paymentStatus, loading, error, checkStatusPaymentSession } = usePaymentStatus();

    useEffect(() => {
        if (session_id) {
            checkStatusPaymentSession(session_id as string);
        }
    }, [session_id]);

    useEffect(() => {
        if (paymentStatus === "paid") {
            console.log('Payment was successful!');
            // Perform any additional actions like updating the database or notifying the user
        }
    }, [paymentStatus]);

    if (loading) {
        return (
            <Box>
                <LoadingOverlay visible={loading} />
                Checking payment status...
            </Box>
        );
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return <p>Payment was successful! Thank you for your purchase.</p>;
}
