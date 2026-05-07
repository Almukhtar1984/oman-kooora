import {Notyf} from "notyf";
export const handlePaymentRedirect = (sessionId) => {
    const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
    const publishableKey = process.env.NEXT_PUBLIC_THAWANI_PUBLISHABLE_KEY;
    console.log("==== redirected !")
    if (sessionId && publishableKey) {
        const paymentUrl = `https://uatcheckout.thawani.om/pay/${sessionId}?key=${publishableKey}`;
        notyf.success("تم اضافة الدفع بنجاح")
        window.location.href = paymentUrl;
    } else {
        console.error('Session ID or Publishable Key is missing');
    }
};