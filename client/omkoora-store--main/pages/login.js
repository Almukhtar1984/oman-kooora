import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { gql, setToken } from "../lib/api";

const LOGIN = `
  mutation ($content: loginInfo) {
    authenticateUser(content: $content) { token }
  }
`;
const ME = `{ currentUser { id role } }`;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const data = await gql(LOGIN, { content: { email: email.trim(), password } });
      const token = data?.authenticateUser?.token;
      if (!token) throw new Error("بيانات الدخول غير صحيحة");
      setToken(token);
      // Route by role: the platform admin (super-admin) manages the whole
      // marketplace; a merchant (store owner) manages only their own store.
      let role = null;
      try { role = (await gql(ME))?.currentUser?.role; } catch {}
      router.replace(role === "1" ? "/admin" : "/merchant");
    } catch (e2) {
      setErr(e2.message || "تعذّر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <Head><title>تسجيل الدخول · سوق طموح</title></Head>

      <aside className="auth-brand">
        <span className="net" />
        <span className="ring a" />
        <span className="ring b" />
        <span className="pitch" />
        <div className="mark"><span className="mk">⚽</span> طموح</div>
        <div className="hero">
          <span className="eyebrow">منصّة طموح الرياضية</span>
          <h2>سوق طموح الرياضي</h2>
          <p>متجرك الرياضي في مكان واحد — أدِر منتجاتك وطلباتك، وتابع مبيعاتك بسهولة واحترافية.</p>
        </div>
        <div className="foot"><span>© طموح</span><span>omkooora.com</span></div>
      </aside>

      <div className="auth-form">
        <form className="auth-card" onSubmit={submit}>
          <h1>تسجيل الدخول</h1>
          <p className="sub">لوحة الإدارة والتجّار</p>
          {err ? <div className="auth-err">{err}</div> : null}
          <div className="auth-f">
            <label>البريد الإلكتروني</label>
            <div className="box">
              <span className="ic">✉️</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="owner@omkooora.com" />
            </div>
          </div>
          <div className="auth-f">
            <label>كلمة المرور</label>
            <div className="box">
              <span className="ic">🔒</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
          </div>
          <button className="auth-submit" disabled={loading}>
            {loading ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
