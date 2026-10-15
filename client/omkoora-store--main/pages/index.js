import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { gql, gqlUpload, getToken, clearToken, imageUrl, firstImage, OMAN_GOVERNORATES } from "../lib/api";

const ME = `{ currentUser { id email role } }`;
const MY_STORES = `{
  myStores { id name about logo images phone whatsapp mohafada wiliya is_active }
}`;
const MY_PRODUCTS = `{
  myStoreProducts { id name about price quantity images is_available id_store store { id name } }
}`;
const MY_ORDERS = `{
  myStoreOrders {
    id full_name phone address note total status payment_method payment_status
    id_store store { id name } items { id product_name price quantity } createdAt
  }
}`;
const MY_REPORT = `{ myStoreReport { id_store store_name orders_count total_sales } }`;
const MY_NOTIFS = `{ allNotificationUser { id body isRead createdAt } }`;

const CREATE_STORE = `mutation ($content: contentStore!) { createStore(content: $content) { id } }`;
const UPDATE_STORE = `mutation ($id: ID!, $content: contentStore!) { updateStore(id: $id, content: $content) { status } }`;
const CREATE_PRODUCT = `mutation ($content: contentProduct!) { createProduct(content: $content) { id } }`;
const UPDATE_PRODUCT = `mutation ($id: ID!, $content: contentProduct!) { updateProduct(id: $id, content: $content) { status } }`;
const DELETE_PRODUCT = `mutation ($id: ID!) { deleteProduct(id: $id) { status } }`;
const SET_ORDER_STATUS = `mutation ($idOrder: ID!, $status: String!) { updateOrderStatus(idOrder: $idOrder, status: $status) { status } }`;
const MARK_READ = `mutation { markMyNotificationsAsRead }`;

const orderBadge = (s) =>
  s === "accepted" ? ["b-blue", "مقبول"]
  : s === "delivered" ? ["b-green", "تم التسليم"]
  : s === "rejected" ? ["b-red", "مرفوض"]
  : ["b-amber", "قيد الانتظار"];
const payBadge = (p) => (p === "paid" ? ["b-green", "مدفوع"] : ["b-gray", "غير مدفوع"]);

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("store");
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [report, setReport] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [editStore, setEditStore] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  const loadAll = useCallback(async () => {
    try {
      const [s, p, o, rep, n] = await Promise.all([
        gql(MY_STORES), gql(MY_PRODUCTS), gql(MY_ORDERS), gql(MY_REPORT), gql(MY_NOTIFS),
      ]);
      setStores(s.myStores || []);
      setProducts(p.myStoreProducts || []);
      setOrders(o.myStoreOrders || []);
      setReport(rep.myStoreReport || []);
      setNotifs(n.allNotificationUser || []);
    } catch (e) {
      flash("تعذّر تحميل البيانات: " + e.message);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    (async () => {
      try {
        const d = await gql(ME);
        setMe(d.currentUser);
        await loadAll();
      } catch (e) {
        clearToken();
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router, loadAll]);

  const logout = () => { clearToken(); router.replace("/login"); };

  // ---- Store ----
  const saveStore = async (form, logoFile, imageFiles) => {
    setBusy(true);
    try {
      const content = {
        name: form.name,
        about: form.about || "",
        phone: form.phone || "",
        whatsapp: form.whatsapp || "",
        mohafada: form.mohafada || "",
        wiliya: form.wiliya || "",
        is_active: form.is_active,
      };
      const files = [];
      if (logoFile) { content.logo = null; files.push({ path: "content.logo", file: logoFile }); }
      if (imageFiles && imageFiles.length) {
        content.images = imageFiles.map(() => null);
        imageFiles.forEach((f, i) => files.push({ path: `content.images.${i}`, file: f }));
      }
      const run = (q, vars) => (files.length ? gqlUpload(q, vars, files) : gql(q, vars));
      if (editStore.id) {
        await run(UPDATE_STORE, { id: editStore.id, content });
        flash("تم تحديث المتجر");
      } else {
        await run(CREATE_STORE, { content });
        flash("تمت إضافة المتجر");
      }
      setEditStore(null);
      await loadAll();
    } catch (e) { flash("خطأ: " + e.message); } finally { setBusy(false); }
  };

  // ---- Product ----
  const saveProduct = async (form, imageFiles) => {
    setBusy(true);
    try {
      const content = {
        name: form.name,
        about: form.about || "",
        price: parseFloat(form.price) || 0,
        quantity: form.quantity === "" ? null : parseInt(form.quantity, 10),
        is_available: form.is_available,
      };
      const files = [];
      if (imageFiles && imageFiles.length) {
        content.images = imageFiles.map(() => null);
        imageFiles.forEach((f, i) => files.push({ path: `content.images.${i}`, file: f }));
      }
      const run = (q, vars) => (files.length ? gqlUpload(q, vars, files) : gql(q, vars));
      if (editProduct.id) {
        await run(UPDATE_PRODUCT, { id: editProduct.id, content });
        flash("تم تحديث المنتج");
      } else {
        content.id_store = form.id_store;
        await run(CREATE_PRODUCT, { content });
        flash("تمت إضافة المنتج");
      }
      setEditProduct(null);
      await loadAll();
    } catch (e) { flash("خطأ: " + e.message); } finally { setBusy(false); }
  };

  const removeProduct = async (id) => {
    if (!confirm("حذف هذا المنتج؟")) return;
    try { await gql(DELETE_PRODUCT, { id }); flash("تم الحذف"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  // ---- Orders ----
  const setOrderStatus = async (idOrder, status) => {
    const label = status === "accepted" ? "تم قبول الطلب"
      : status === "rejected" ? "تم رفض الطلب"
      : status === "delivered" ? "تم تعليم الطلب كمُسلّم" : "تم التحديث";
    try { await gql(SET_ORDER_STATUS, { idOrder, status }); flash(label); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  const markRead = async () => { try { await gql(MARK_READ); await loadAll(); } catch (e) { flash(e.message); } };

  if (loading) return <div className="empty" style={{ marginTop: 80 }}>جارٍ التحميل…</div>;

  const waiting = orders.filter((o) => o.status === "waiting" || !o.status).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const unread = notifs.filter((n) => !n.isRead).length;
  const hasStore = stores.length > 0;
  const salesTotal = report.reduce((a, r) => a + (r.total_sales || 0), 0);

  return (
    <div>
      <div className="topbar">
        <div className="brand"><span className="dot" /> لوحة صاحب المتجر · طموح</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, opacity: .9 }}>{me?.email}</span>
          <button className="btn sm" onClick={logout}>خروج</button>
        </div>
      </div>

      <div className="container">
        <div className="kpis">
          <div className="kpi"><div className="n">{products.length}</div><div className="l">المنتجات</div></div>
          <div className="kpi"><div className="n">{waiting}</div><div className="l">طلبات قيد الانتظار</div></div>
          <div className="kpi"><div className="n">{delivered}</div><div className="l">طلبات مُسلّمة</div></div>
          <div className="kpi"><div className="n">{salesTotal}</div><div className="l">إجمالي المبيعات (ر.ع)</div></div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "store" ? "active" : ""}`} onClick={() => setTab("store")}>المتجر <span className="count">{stores.length}</span></button>
          <button className={`tab ${tab === "products" ? "active" : ""}`} onClick={() => setTab("products")}>المنتجات <span className="count">{products.length}</span></button>
          <button className={`tab ${tab === "orders" ? "active" : ""}`} onClick={() => setTab("orders")}>الطلبات <span className="count">{orders.length}</span></button>
          <button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>التقرير</button>
          <button className={`tab ${tab === "notifs" ? "active" : ""}`} onClick={() => setTab("notifs")}>الإشعارات <span className="count">{unread}</span></button>
        </div>

        {/* ---- Store ---- */}
        {tab === "store" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>ملف المتجر</h3>
              <button className="btn primary" onClick={() => setEditStore({})}>+ إضافة متجر</button>
            </div>
            {!hasStore ? (
              <div className="empty">لا يوجد متجر بعد. أنشئ متجرك الأول.</div>
            ) : (
              <div className="grid">
                {stores.map((s) => {
                  const imgs = (s.images || "").split(",").map((x) => x.trim()).filter(Boolean);
                  return (
                    <div className="card" key={s.id}>
                      <div className="row" style={{ alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {s.logo ? <img className="logo-thumb" src={imageUrl(s.logo)} alt="" /> : null}
                          <div>
                            <h3 style={{ margin: 0 }}>{s.name}</h3>
                            <div className="meta">{[s.mohafada, s.wiliya].filter(Boolean).join(" · ") || "—"}</div>
                          </div>
                        </div>
                        <span className={`badge ${s.is_active ? "b-green" : "b-gray"}`}>{s.is_active ? "ظاهر" : "مخفي"}</span>
                      </div>
                      <div className="meta" style={{ marginTop: 8 }}>{s.about && s.about !== "-" ? s.about : "—"}</div>
                      <div className="meta">الهاتف: {s.phone || "—"} · واتساب: {s.whatsapp || "—"}</div>
                      {imgs.length ? (
                        <div className="thumbs">{imgs.map((im, i) => <img key={i} src={imageUrl(im)} alt="" />)}</div>
                      ) : null}
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn sm" onClick={() => setEditStore(s)}>تعديل</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---- Products ---- */}
        {tab === "products" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>المنتجات</h3>
              <button className="btn primary" disabled={!hasStore} onClick={() => setEditProduct({ id_store: stores[0]?.id })}>+ إضافة منتج</button>
            </div>
            {!hasStore ? (
              <div className="empty">أنشئ متجرًا أولًا لإضافة المنتجات.</div>
            ) : products.length === 0 ? (
              <div className="empty">لا توجد منتجات بعد.</div>
            ) : (
              <div className="grid">
                {products.map((p) => {
                  const img = firstImage(p.images);
                  return (
                    <div className="card" key={p.id}>
                      {img ? <img className="prod-img" src={img} alt="" /> : null}
                      <div className="row"><h3 style={{ margin: 0 }}>{p.name}</h3><span className={`badge ${p.is_available ? "b-green" : "b-gray"}`}>{p.is_available ? "متاح" : "مخفي"}</span></div>
                      {stores.length > 1 ? <div className="meta">المتجر: {p.store?.name || "—"}</div> : null}
                      <div className="meta">السعر: <b>{p.price ?? 0} ر.ع</b>{p.quantity != null ? ` · الكمية: ${p.quantity}` : ""}</div>
                      {p.about ? <div className="meta">{p.about}</div> : null}
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn sm" onClick={() => setEditProduct(p)}>تعديل</button>
                        <button className="btn sm red" onClick={() => removeProduct(p.id)}>حذف</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---- Orders ---- */}
        {tab === "orders" && (
          orders.length === 0 ? (
            <div className="empty">لا توجد طلبات بعد.</div>
          ) : (
            <div className="grid">
              {orders.map((o) => {
                const [bc, bl] = orderBadge(o.status);
                const [pc, pl] = payBadge(o.payment_status);
                return (
                  <div className="card" key={o.id}>
                    <div className="row"><h3 style={{ margin: 0 }}>{o.full_name || "عميل"}</h3><span className={`badge ${bc}`}>{bl}</span></div>
                    {stores.length > 1 ? <div className="meta">المتجر: {o.store?.name || "—"}</div> : null}
                    <div className="meta">الهاتف: {o.phone || "—"}</div>
                    <div className="meta">العنوان: {o.address || "—"}</div>
                    {o.note ? <div className="meta">ملاحظة: {o.note}</div> : null}
                    <div className="items">
                      {(o.items || []).map((it) => (
                        <div className="line" key={it.id}>
                          <span>{it.product_name} <span className="q">×{it.quantity}</span></span>
                          <span>{(it.price * it.quantity).toFixed(2)} ر.ع</span>
                        </div>
                      ))}
                    </div>
                    <div className="row">
                      <span className="meta">الدفع عند الاستلام · <span className={`badge ${pc}`}>{pl}</span></span>
                      <b>{o.total} ر.ع</b>
                    </div>
                    <div className="meta" style={{ marginTop: 2 }}>{o.createdAt}</div>
                    {(o.status === "waiting" || !o.status) && (
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn sm green" onClick={() => setOrderStatus(o.id, "accepted")}>قبول</button>
                        <button className="btn sm red" onClick={() => setOrderStatus(o.id, "rejected")}>رفض</button>
                      </div>
                    )}
                    {o.status === "accepted" && (
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn sm green" onClick={() => setOrderStatus(o.id, "delivered")}>تم التسليم (قبض نقدي)</button>
                        <button className="btn sm red" onClick={() => setOrderStatus(o.id, "rejected")}>إلغاء</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ---- Report ---- */}
        {tab === "report" && (
          report.length === 0 ? (
            <div className="empty">لا توجد بيانات بعد.</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>المتجر</th><th>عدد الطلبات المحقّقة</th><th>إجمالي المبيعات (ر.ع)</th></tr>
              </thead>
              <tbody>
                {report.map((row, i) => (
                  <tr key={row.id_store || `none-${i}`}>
                    <td>{row.store_name || "—"}</td>
                    <td>{row.orders_count}</td>
                    <td><b>{row.total_sales}</b></td>
                  </tr>
                ))}
                <tr>
                  <td><b>المجموع</b></td>
                  <td><b>{report.reduce((a, r) => a + (r.orders_count || 0), 0)}</b></td>
                  <td><b>{salesTotal}</b></td>
                </tr>
              </tbody>
            </table>
          )
        )}

        {/* ---- Notifications ---- */}
        {tab === "notifs" && (
          <>
            {unread > 0 && (
              <div className="row" style={{ marginBottom: 10 }}>
                <span className="meta">لديك {unread} إشعار غير مقروء</span>
                <button className="btn sm" onClick={markRead}>تعليم الكل كمقروء</button>
              </div>
            )}
            {notifs.length === 0 ? (
              <div className="empty">لا توجد إشعارات.</div>
            ) : (
              notifs.map((n) => (
                <div className="card" key={n.id} style={{ marginBottom: 8, borderInlineStart: `4px solid ${n.isRead ? "#cbd5e1" : "var(--primary)"}` }}>
                  <div>{n.body}</div>
                  <div className="meta" style={{ marginTop: 4 }}>{n.createdAt}</div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {editStore && (
        <StoreForm initial={editStore} busy={busy} onCancel={() => setEditStore(null)} onSave={saveStore} />
      )}
      {editProduct && (
        <ProductForm initial={editProduct} stores={stores} busy={busy} onCancel={() => setEditProduct(null)} onSave={saveProduct} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function StoreForm({ initial, onCancel, onSave, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    about: initial.about && initial.about !== "-" ? initial.about : "",
    phone: initial.phone || "",
    whatsapp: initial.whatsapp || "",
    mohafada: initial.mohafada || "",
    wiliya: initial.wiliya || "",
    is_active: initial.is_active !== false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial.id ? "تعديل المتجر" : "إضافة متجر"}</h2>
        <div className="field">
          <label>اسم المتجر *</label>
          <input value={form.name} onChange={set("name")} placeholder="متجر الطموح الرياضي" />
        </div>
        <div className="field">
          <label>نبذة</label>
          <textarea rows={2} value={form.about} onChange={set("about")} placeholder="وصف المتجر وما يبيعه" />
        </div>
        <div className="form-grid">
          <div className="field"><label>الهاتف</label><input value={form.phone} onChange={set("phone")} placeholder="9xxxxxxx" /></div>
          <div className="field"><label>واتساب</label><input value={form.whatsapp} onChange={set("whatsapp")} placeholder="9xxxxxxx" /></div>
          <div className="field">
            <label>المحافظة</label>
            <select value={form.mohafada} onChange={set("mohafada")}>
              <option value="">— اختر —</option>
              {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label>الولاية</label><input value={form.wiliya} onChange={set("wiliya")} placeholder="السيب" /></div>
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            المتجر ظاهر في التطبيق
          </label>
        </div>
        <div className="field">
          <label>الشعار (صورة){initial.logo ? " — اتركه فارغًا للإبقاء على الحالي" : ""}</label>
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
        </div>
        <div className="field">
          <label>صور المتجر (اختياري، عدة صور)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button className="btn primary" onClick={() => onSave(form, logoFile, imageFiles)} disabled={busy || !form.name}>
            {busy ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductForm({ initial, stores, onCancel, onSave, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    about: initial.about || "",
    price: initial.price ?? "",
    quantity: initial.quantity ?? "",
    is_available: initial.is_available !== false,
    id_store: initial.id_store || stores[0]?.id || "",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial.id ? "تعديل المنتج" : "إضافة منتج"}</h2>
        {!initial.id && stores.length > 1 && (
          <div className="field">
            <label>المتجر *</label>
            <select value={form.id_store} onChange={set("id_store")}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>اسم المنتج *</label>
          <input value={form.name} onChange={set("name")} placeholder="قميص الفريق" />
        </div>
        <div className="form-grid">
          <div className="field"><label>السعر (ر.ع) *</label><input type="number" step="0.5" value={form.price} onChange={set("price")} placeholder="12.5" /></div>
          <div className="field"><label>الكمية (اختياري)</label><input type="number" value={form.quantity} onChange={set("quantity")} placeholder="20" /></div>
        </div>
        <div className="field">
          <label>الوصف</label>
          <textarea rows={2} value={form.about} onChange={set("about")} placeholder="تفاصيل المنتج" />
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" style={{ width: "auto" }} checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            المنتج متاح للبيع
          </label>
        </div>
        <div className="field">
          <label>صور المنتج (اختياري، عدة صور)</label>
          <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files || []))} />
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button className="btn primary" onClick={() => onSave(form, imageFiles)} disabled={busy || !form.name || !form.id_store}>
            {busy ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
