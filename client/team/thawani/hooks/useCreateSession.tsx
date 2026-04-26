import { useState } from 'react';

interface UsePostRequestProps<T> {
    data: T | null;
    error: string | null;
    loading: boolean;
    post: (body: any) => Promise<void>;
}

export const useCreateSession = <T = any>(): UsePostRequestProps<T> => {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    // Construct the create session URL using the environment variable
    const createSessionUrl = `${process.env.NEXT_PUBLIC_THAWANI_API}/checkout/session`;
    
    const post = async (body: any): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(createSessionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'thawani-api-key': process.env.NEXT_PUBLIC_THAWANI_SECRET_KEY || '',
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { data, error, loading, post };
};
