import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Button } from '@mantine/core';

export default function PaymentCancel() {
    const router = useRouter();

    useEffect(() => {
        console.log('Payment was canceled.');
        // Perform any actions required on cancellation, like notifying the user or reverting any changes
    }, []);

    const handleRetry = () => {
        router.push('/'); // Redirect the user to retry the payment or back to the homepage
    };

    return (
        <Box>
            <p>Payment was canceled. Please try again.</p>
            <Button onClick={handleRetry}>Retry Payment</Button>
        </Box>
    );
}
