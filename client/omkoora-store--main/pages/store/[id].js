import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { gql, imageUrl, firstImage, loadCart, saveCart } from "../../lib/api";

const STORE = `query($id: ID!){
  store(id: $id){ id name about logo phone whatsapp mohafada wiliya }
}`;
const STORE_PRODUCTS = `query($id: ID!){
  storeProducts(idStore: $id){ id name price images about }
}`;

const priceFmt = (n) => (n == null ? "—" : `${Number(n)} ر.ع`);

export default function StoreProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([gql(STORE, { id }), gql(STORE_PRODUCTS, { id })])
      .then(([s, p]) => { setStore(s.store); setProducts(p.storeProducts || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
    setCart(loadCart());
  }, [id]);

  const count = cart.reduce((n, i) => n + i.qty, 0);
  const inCart = (pid) => cart.some((i) => i.id === pid);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3200); };

  const addToCart = (p) => {
    const next = (() => {
      const ex = cart.find((i) => i.id === p.id);
      if (ex) return cart.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...cart, { id: p.id, name: p.name, price: p.price, qty: 1, id_store: store.id, store_name: store.name }];
    })();
    setCart(next); saveCart(next); showToast("أُضيف إلى السلة");
  };

  return (
    <div className="mpage">
      <Head><title>{store ? `${store.name} · متجر طموح` : "متجر طموح"}</title></Head>

      <header className="mhead">
        <Link href="/" className="mbrand"><span className="mk">🛍️</span> طموح · المتجر</Link>
        <div style={{ flex: 1 }} />
        <button className="cart" onClick={() => router.push("/?cart=1")}>
          🛒 السلة {count > 0 ? <span className="cnt">{count}</span> : null}
        </button>
        <button className="login" onClick={() => router.push("/login")}>دخول</button>
      </header>

      {loading ? (
        <div className="mempty" style={{ padding: 60 }}>يتم التحميل…</div>
      ) : !store ? (
        <div className="mempty" style={{ padding: 60 }}>المتجر غير موجود. <Link href="/" className="st">العودة للمتجر</Link></div>
      ) : (
        <>
          <section className="mprofile">
            <div className="mprofile-in">
              <span className="lg">{store.logo ? <img src={imageUrl(store.logo)} alt={store.name} /> : "🏬"}</span>
              <div>
                <h1>{store.name}</h1>
                <div className="meta">
                  <span>📍 {store.mohafada}{store.wiliya ? ` — ${store.wiliya}` : ""}</span>
                  {store.phone ? <span>📞 {store.phone}</span> : null}
                  {store.whatsapp ? <span>واتساب {store.whatsapp}</span> : null}
                </div>
                {store.about ? <p style={{ color: "#b9c6e6", margin: "8px 0 0", maxWidth: "60ch" }}>{store.about}</p> : null}
              </div>
            </div>
          </section>

          <main className="mwrap">
            <Link href="/" className="mback">← كل المتاجر</Link>
            <div className="msec"><h2>المنتجات</h2><span className="n">{products.length} منتج</span></div>

            {products.length === 0 ? (
              <div className="mempty">لا توجد منتجات في هذا المتجر بعد.</div>
            ) : (
              <div className="mgrid">
                {products.map((p) => {
                  const img = firstImage(p.images);
                  return (
                    <article className="mprod" key={p.id}>
                      <div className="img">{img ? <img src={img} alt={p.name} /> : <span className="ic">📦</span>}</div>
                      <div className="body">
                        <h3>{p.name}</h3>
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
        </>
      )}
      {toast ? <div className="mtoast">{toast}</div> : null}
    </div>
  );
}
