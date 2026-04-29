import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Outbox() {
    const router = useRouter();

    useEffect(() => {
        router.replace({ pathname: '/messages', query: { tab: 'outbox' } });
    }, [router]);

    return null;
}
