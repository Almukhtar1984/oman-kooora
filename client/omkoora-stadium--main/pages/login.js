import { useState } from "react";
import { useRouter } from "next/router";
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
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>لوحة صاحب الملعب</h1>
        <p>منصّة طموح · سجّل الدخول بحسابك</p>
        {err ? <div className="err">{err}</div> : null}
        <div className="field">
          <label>البريد الإلكتروني</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="owner@omkooora.com" />
        </div>
        <div className="field">
          <label>كلمة المرور</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
          {loading ? "جارٍ الدخول…" : "دخول"}
        </button>
      </form>
    </div>
  );
}
