import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { gql, setToken } from "../lib/api";

const LOGIN = `
  mutation ($content: loginInfo) {
    authenticateUser(content: $content) { token }
  }
`;

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
      router.replace("/");
    } catch (e2) {
      setErr(e2.message || "تعذّر تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <Head><title>تسجيل الدخول · أكاديميات طموح</title></Head>

      <aside className="auth-brand">
        <span className="net" />
        <span className="ring a" />
        <span className="ring b" />
        <span className="pitch" />
        <div className="mark"><span className="mk">⚽</span> طموح</div>
        <div className="hero">
          <span className="eyebrow">منصّة طموح الرياضية</span>
          <h2>أكاديميات طموح</h2>
          <p>أدِر أكاديميتك ولاعبيك ومجموعاتك التدريبية من مكان واحد — بتنظيم واحترافية.</p>
        </div>
        <div className="foot"><span>© طموح</span><span>omkooora.com</span></div>
      </aside>

      <div className="auth-form">
        <form className="auth-card" onSubmit={submit}>
          <h1>لوحة الأكاديمية</h1>
          <p className="sub">دخول صاحب الأكاديمية</p>
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
