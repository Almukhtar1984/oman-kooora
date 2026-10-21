import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { gql, imageUrl, firstImage, OMAN_GOVERNORATES, loadCart, saveCart } from "../lib/api";

const ALL_PRODUCTS = `{
  allProducts { id name price images about
    store { id name mohafada wiliya logo } }
}`;
const STORES = `{ stores { id name mohafada wiliya logo } }`;
const CREATE_ORDER = `mutation($c: contentOrder!){ createOrder(content: $c){ id status } }`;

const priceFmt = (n) => (n == null ? "—" : `${Number(n)} ر.ع`);

export default function Marketplace() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [gov, setGov] = useState("");
  const [sort, setSort] = useState("new");
  const [storeId, setStoreId] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([gql(ALL_PRODUCTS), gql(STORES)])
      .then(([p, s]) => { setProducts(p.allProducts || []); setStores(s.stores || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
    setCart(loadCart());
  }, []);

  // Open the cart when arriving from a store profile with ?cart=1.
  useEffect(() => { if (router.query.cart) setCartOpen(true); }, [router.query.cart]);

  // Persist the cart so the store-profile page shares it.
  useEffect(() => { saveCart(cart); }, [cart]);

  const list = useMemo(() => {
    let r = products.filter(
      (p) =>
        (!gov || p.store?.mohafada === gov) &&
        (!storeId || p.store?.id === storeId) &&
        (!q || `${p.name} ${p.store?.name || ""}`.includes(q.trim()))
    );
    if (sort === "price_a") r = [...r].sort((a, b) => a.price - b.price);
    else if (sort === "price_d") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [products, gov, storeId, q, sort]);

  const count = cart.reduce((n, i) => n + i.qty, 0);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3600); };

  const addToCart = (p) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { id: p.id, name: p.name, price: p.price, qty: 1, id_store: p.store?.id, store_name: p.store?.name }];
    });
    showToast("أُضيف إلى السلة");
  };
  const inCart = (id) => cart.some((i) => i.id === id);

  return (
    <div className="mpage">
      <Head><title>متجر طموح · المستلزمات الرياضية</title></Head>

      <header className="mhead">
        <div className="mbrand"><span className="mk">🛍️</span> طموح · المتجر</div>
        <div className="msearch-top">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن منتج أو متجر…" />
        </div>
        <button className="cart" onClick={() => setCartOpen(true)}>
          🛒 السلة {count > 0 ? <span className="cnt">{count}</span> : null}
        </button>
        <button className="login" onClick={() => router.push("/login")}>دخول</button>
      </header>

      <section className="mhero">
        <div className="mhero-in">
          <h1>كل مستلزماتك الرياضية في مكان واحد</h1>
          <p>تصفّح متاجر رياضية موثوقة في عُمان، أضف للسلة، واطلب بالدفع عند الاستلام.</p>
        </div>
      </section>

      <main className="mwrap">
        <div className="mfilters">
          <select value={gov} onChange={(e) => setGov(e.target.value)}>
            <option value="">كل المحافظات</option>
            {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">الأحدث</option>
            <option value="price_a">الأقل سعراً</option>
            <option value="price_d">الأعلى سعراً</option>
          </select>
          <span className={`mchip ${!storeId ? "on" : ""}`} onClick={() => setStoreId("")}>كل المتاجر</span>
          {stores.map((s) => (
            <span key={s.id} className={`mchip ${storeId === s.id ? "on" : ""}`} onClick={() => setStoreId(s.id)}>{s.name}</span>
          ))}
        </div>

        {stores.length > 0 && !storeId ? (
          <>
            <div className="msec"><h2>المتاجر</h2><span className="n">{stores.length} متجر</span></div>
            <div className="mstores">
              {stores.map((s) => (
                <Link href={`/store/${s.id}`} key={s.id} className="mstore">
                  <span className="av">{s.logo ? <img src={imageUrl(s.logo)} alt={s.name} /> : "🏬"}</span>
                  <span>
                    <span className="nm" style={{ display: "block" }}>{s.name}</span>
                    <span className="lc">📍 {s.mohafada}{s.wiliya ? ` — ${s.wiliya}` : ""}</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}

        <div className="msec">
          <h2>{storeId ? "منتجات المتجر" : "كل المنتجات"}</h2>
          <span className="n">{loading ? "يتم التحميل…" : `${list.length} منتج`}</span>
        </div>

        {loading ? null : list.length === 0 ? (
          <div className="mempty">لا توجد منتجات مطابقة. جرّب فلترًا آخر.</div>
        ) : (
          <div className="mgrid">
            {list.map((p) => {
              const img = firstImage(p.images);
              return (
                <article className="mprod" key={p.id}>
                  <div className="img">{img ? <img src={img} alt={p.name} /> : <span className="ic">📦</span>}</div>
                  <div className="body">
                    <h3>{p.name}</h3>
                    {p.store ? <Link href={`/store/${p.store.id}`} className="st">{p.store.name}</Link> : null}
                    <div className="pr">{priceFmt(p.price)}</div>
                    <button className={`add ${inCart(p.id) ? "in" : ""}`} onClick={() => addToCart(p)}>
                      {inCart(p.id) ? "✓ في السلة — أضف المزيد" : "أضف للسلة"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {cartOpen ? (
        <Cart cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} onDone={(m) => { setCart([]); setCartOpen(false); showToast(m); }} />
      ) : null}
      {toast ? <div className="mtoast">{toast}</div> : null}
    </div>
  );
}

function Cart({ cart, setCart, onClose, onDone }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const groups = useMemo(() => {
    const m = {};
    cart.forEach((i) => { (m[i.id_store] = m[i.id_store] || { store_name: i.store_name, items: [] }).items.push(i); });
    return m;
  }, [cart]);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const setQty = (id, d) => setCart((c) =>
    c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i)));
  const remove = (id) => setCart((c) => c.filter((i) => i.id !== id));

  const checkout = async () => {
    if (!name.trim() || !phone.trim()) { setErr("الاسم ورقم الهاتف مطلوبان"); return; }
    setSaving(true); setErr("");
    try {
      // One order per store (the backend's order is store-scoped).
      for (const [id_store, g] of Object.entries(groups)) {
        await gql(CREATE_ORDER, {
          c: {
            full_name: name.trim(), phone: phone.trim(), address: address.trim(), note: note.trim(),
            id_store,
            items: g.items.map((i) => ({ id_product: i.id, quantity: i.qty })),
          },
        });
      }
      onDone("تم إرسال طلبك — سيتواصل معك المتجر لتأكيده");
    } catch (e) {
      setErr(e.message || "تعذّر إتمام الطلب"); setSaving(false);
    }
  };

  return (
    <div className="mcart-back" onClick={onClose}>
      <aside className="mcart" onClick={(e) => e.stopPropagation()}>
        <button className="cx" onClick={onClose} aria-label="إغلاق">×</button>
        <h2>سلة المشتريات</h2>
        {cart.length === 0 ? (
          <div className="mempty">سلتك فارغة. أضف منتجات لتبدأ الطلب.</div>
        ) : (
          <>
            {Object.entries(groups).map(([sid, g]) => (
              <div className="mcartstore" key={sid}>
                <div className="sh">🏬 {g.store_name}</div>
                {g.items.map((i) => (
                  <div className="mci" key={i.id}>
                    <span className="nm">{i.name}<br /><span className="pr">{priceFmt(i.price)}</span></span>
                    <span className="mqty">
                      <button onClick={() => setQty(i.id, -1)}>−</button>
                      <b>{i.qty}</b>
                      <button onClick={() => setQty(i.id, +1)}>+</button>
                      <button onClick={() => remove(i.id)} style={{ color: "#b91c1c" }}>🗑</button>
                    </span>
                  </div>
                ))}
              </div>
            ))}

            <div className="mcart-form">
              <input placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="tel" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input placeholder="العنوان (اختياري)" value={address} onChange={(e) => setAddress(e.target.value)} />
              <textarea placeholder="ملاحظة للمتجر (اختياري)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            {err ? <div className="err">{err}</div> : null}
            <div className="mtotal"><span>الإجمالي</span><span>{priceFmt(total)}</span></div>
            <button className="mco" disabled={saving} onClick={checkout}>
              {saving ? "جارٍ إرسال الطلب…" : "أكّد الطلب"}
            </button>
            <div className="mcod">الدفع عند الاستلام — لن يُخصم أي مبلغ الآن.</div>
          </>
        )}
      </aside>
    </div>
  );
}
