import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Inbox() {
    const router = useRouter();

    useEffect(() => {
        router.replace({ pathname: '/messages', query: { tab: 'inbox' } });
    }, [router]);

    return null;
}
