import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { gql, getToken, clearToken, OMAN_GOVERNORATES } from "../lib/api";

const ME = `{ currentUser { id email role } }`;
const DATA = `{
  stores { id name mohafada is_active owner { id email } }
  adminStoreOwners { id email }
  adminOrders { id full_name phone total status createdAt store { id name } }
}`;
const PROVISION = `mutation($e: String!, $p: String!){ provisionStoreOwner(email: $e, password: $p){ id email } }`;
const CREATE_STORE = `mutation($c: contentStore!){ createStore(content: $c){ id name } }`;
const UPDATE_STORE = `mutation($id: ID!, $c: contentStore!){ updateStore(id: $id, content: $c){ status } }`;

const money = (n) => `${Number(n || 0)} ر.ع`;
const ORDER_LABEL = { waiting: "قيد الانتظار", accepted: "مقبول", delivered: "تم التسليم", rejected: "مرفوض", cancelled: "ملغى" };

export default function Admin() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [owners, setOwners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("stores");
  const [showAdd, setShowAdd] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [toast, setToast] = useState("");

  const loadAll = useCallback(async () => {
    const d = await gql(DATA);
    setStores(d.stores || []);
    setOwners(d.adminStoreOwners || []);
    setOrders(d.adminOrders || []);
  }, []);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    (async () => {
      try {
        const d = await gql(ME);
        if (d?.currentUser?.role !== "1") { router.replace("/merchant"); return; }
        setMe(d.currentUser);
        await loadAll();
      } catch { clearToken(); router.replace("/login"); }
      finally { setLoading(false); }
    })();
  }, [router, loadAll]);

  const logout = () => { clearToken(); router.replace("/"); };
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3600); };

  const kpis = {
    stores: stores.length,
    merchants: owners.length,
    orders: orders.length,
    sales: orders.filter((o) => ["accepted", "delivered"].includes(o.status)).reduce((s, o) => s + Number(o.total || 0), 0),
  };

  if (loading) return <div className="empty" style={{ padding: 60 }}>يتم التحميل…</div>;

  return (
    <div>
      <Head><title>لوحة إدارة المتاجر · طموح</title></Head>
      <div className="topbar">
        <div className="brand"><span className="dot" /> لوحة إدارة المتاجر · طموح</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, opacity: .9 }}>{me?.email}</span>
          <button className="btn sm" onClick={() => router.push("/")}>عرض المتجر</button>
          <button className="btn sm" onClick={logout}>خروج</button>
        </div>
      </div>

      <div className="container">
        <div className="kpis">
          <div className="kpi"><div className="n">{kpis.stores}</div><div className="l">متجر</div></div>
          <div className="kpi"><div className="n">{kpis.merchants}</div><div className="l">تاجر</div></div>
          <div className="kpi"><div className="n">{kpis.orders}</div><div className="l">طلب</div></div>
          <div className="kpi"><div className="n">{money(kpis.sales)}</div><div className="l">مبيعات مؤكّدة</div></div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "stores" ? "active" : ""}`} onClick={() => setTab("stores")}>المتاجر والتجّار</button>
          <button className={`tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>الطلبات<span className="count">{orders.length}</span></button>
        </div>

        {tab === "stores" ? (
          <>
            <div className="row" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>المتاجر ({stores.length})</h3>
              <button className="btn primary" onClick={() => setShowAdd(true)}>+ إضافة متجر وتاجر</button>
            </div>
            {stores.length === 0 ? (
              <div className="empty">لا توجد متاجر بعد. أضف أول متجر وأنشئ حساب تاجره.</div>
            ) : (
              <div className="grid">
                {stores.map((s) => (
                  <div className="card" key={s.id}>
                    <div className="row">
                      <h3>{s.name}</h3>
                      <span className={`badge ${s.is_active ? "b-green" : "b-gray"}`}>{s.is_active ? "مفعّل" : "متوقّف"}</span>
                    </div>
                    <div className="meta">📍 {s.mohafada || "—"}</div>
                    <div className="meta">التاجر: {s.owner?.email || "غير مُسند"}</div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <button className="btn sm" onClick={() => setEditStore(s)}>تعديل المتجر</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ margin: "24px 0 10px" }}>حسابات التجّار ({owners.length})</h3>
            {owners.length === 0 ? (
              <div className="empty">لا توجد حسابات تجّار بعد.</div>
            ) : (
              <div className="grid">
                {owners.map((o) => (
                  <div className="card" key={o.id}>
                    <div className="meta" style={{ fontWeight: 700, color: "var(--ink)" }}>{o.email}</div>
                    <div className="meta">متاجره: {stores.filter((s) => s.owner?.id === o.id).map((s) => s.name).join("، ") || "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h3 style={{ margin: "0 0 14px" }}>كل الطلبات ({orders.length})</h3>
            {orders.length === 0 ? (
              <div className="empty">لا توجد طلبات بعد.</div>
            ) : (
              <div className="grid">
                {orders.map((o) => (
                  <div className="card" key={o.id}>
                    <div className="row">
                      <h3>{o.store?.name || "—"}</h3>
                      <span className={`badge ${o.status === "delivered" || o.status === "accepted" ? "b-green" : o.status === "rejected" || o.status === "cancelled" ? "b-red" : "b-amber"}`}>{ORDER_LABEL[o.status] || o.status}</span>
                    </div>
                    <div className="meta">{o.full_name} · {o.phone}</div>
                    <div className="meta" style={{ fontWeight: 700, color: "var(--ink)" }}>{money(o.total)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showAdd ? <AddStore onClose={() => setShowAdd(false)} onDone={async (m) => { setShowAdd(false); await loadAll(); showToast(m); }} /> : null}
      {editStore ? <EditStore store={editStore} onClose={() => setEditStore(null)} onDone={async (m) => { setEditStore(null); await loadAll(); showToast(m); }} /> : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function AddStore({ onClose, onDone }) {
  const [name, setName] = useState("");
  const [mohafada, setMohafada] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) { setErr("اسم المتجر والبريد وكلمة المرور مطلوبة"); return; }
    setSaving(true); setErr("");
    try {
      const u = await gql(PROVISION, { e: email.trim(), p: password });
      const id_user = u?.provisionStoreOwner?.id;
      await gql(CREATE_STORE, { c: { name: name.trim(), mohafada: mohafada || null, phone: phone.trim() || null, is_active: true, id_user } });
      onDone("تم إنشاء المتجر وحساب التاجر");
    } catch (e2) {
      setErr(e2.message || "تعذّر إنشاء المتجر"); setSaving(false);
    }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>إضافة متجر وتاجر</h2>
        <p className="meta" style={{ marginTop: 0 }}>يُنشئ حساب دخول للتاجر ومتجرًا مُسندًا إليه. يسجّل التاجر الدخول ويدير متجره.</p>
        {err ? <div className="err">{err}</div> : null}
        <div className="field"><label>اسم المتجر</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: متجر الأبطال الرياضي" /></div>
        <div className="form-grid">
          <div className="field"><label>المحافظة</label>
            <select value={mohafada} onChange={(e) => setMohafada(e.target.value)}>
              <option value="">— اختر —</option>
              {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label>هاتف المتجر</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9xxxxxxx" /></div>
        </div>
        <div className="field"><label>بريد التاجر (للدخول)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="merchant@omkooora.com" /></div>
        <div className="field"><label>كلمة مرور التاجر</label><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة مرور مبدئية" /></div>
        <div className="row" style={{ marginTop: 14 }}>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? "جارٍ الإنشاء…" : "إنشاء"}</button>
        </div>
      </form>
    </div>
  );
}

function EditStore({ store, onClose, onDone }) {
  const [name, setName] = useState(store.name || "");
  const [mohafada, setMohafada] = useState(store.mohafada || "");
  const [phone, setPhone] = useState(store.phone || "");
  const [isActive, setIsActive] = useState(store.is_active !== false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr("اسم المتجر مطلوب"); return; }
    setSaving(true); setErr("");
    try {
      await gql(UPDATE_STORE, { id: store.id, c: { name: name.trim(), mohafada: mohafada || null, phone: phone.trim() || null, is_active: isActive } });
      onDone("تم تحديث بيانات المتجر");
    } catch (e2) { setErr(e2.message || "تعذّر التحديث"); setSaving(false); }
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>تعديل المتجر</h2>
        <p className="meta" style={{ marginTop: 0 }}>التاجر: {store.owner?.email || "غير مُسند"}</p>
        {err ? <div className="err">{err}</div> : null}
        <div className="field"><label>اسم المتجر</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="form-grid">
          <div className="field"><label>المحافظة</label>
            <select value={mohafada} onChange={(e) => setMohafada(e.target.value)}>
              <option value="">— اختر —</option>
              {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label>هاتف المتجر</label><input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        </div>
        <div className="field"><label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> المتجر ظاهر في السوق
        </label></div>
        <div className="row" style={{ marginTop: 14 }}>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button>
        </div>
      </form>
    </div>
  );
}
