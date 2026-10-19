import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { gql, IMAGES_BASE, OMAN_GOVERNORATES } from "../lib/api";

const ALL_STADIUMS = `{
  allStadiums {
    id name about rent mohafada wiliya sport
    start_time end_time images badge_label features_label min_booking_minutes
  }
}`;

const SLOTS = `query($id: ID!, $d: String!) {
  availableTimeSlots(idStadium: $id, booking_date: $d) {
    label start_time end_time is_available price
  }
}`;

const BOOK = `mutation($c: contentReservations!) {
  createReservations(content: $c) { id status booking_date booking_start booking_end total_price }
}`;

const firstImage = (images) => {
  if (!images) return null;
  const name = String(images).split(/[,\n]/)[0].trim().replace(/^\[?"?|"?\]?$/g, "");
  return name ? `${IMAGES_BASE}/${name}` : null;
};
const today = () => new Date().toISOString().slice(0, 10);
const priceFmt = (n) => (n == null ? "—" : `${Number(n)} ر.ع`);

export default function Visitors() {
  const router = useRouter();
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gov, setGov] = useState("");
  const [sport, setSport] = useState("");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(null); // stadium being booked
  const [toast, setToast] = useState("");

  useEffect(() => {
    gql(ALL_STADIUMS)
      .then((d) => setStadiums(d.allStadiums || []))
      .catch(() => setStadiums([]))
      .finally(() => setLoading(false));
  }, []);

  const sports = useMemo(
    () => Array.from(new Set(stadiums.map((s) => s.sport).filter(Boolean))),
    [stadiums]
  );

  const list = useMemo(
    () =>
      stadiums.filter(
        (s) =>
          (!gov || s.mohafada === gov) &&
          (!sport || s.sport === sport) &&
          (!q || `${s.name} ${s.wiliya || ""} ${s.mohafada || ""}`.includes(q.trim()))
      ),
    [stadiums, gov, sport, q]
  );

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 3800); };

  return (
    <div className="vpage">
      <Head><title>احجز ملعبك · طموح</title></Head>

      <header className="vhead">
        <div className="vbrand"><span className="mk">⚽</span> طموح · الملاعب</div>
        <button className="vlogin" onClick={() => router.push("/login")}>
          <span>🔑</span> دخول المشرف
        </button>
      </header>

      <section className="vhero">
        <div className="lines" /><div className="circle" />
        <div className="vhero-in">
          <h1>احجز ملعبك، والعب الليلة</h1>
          <p>ملاعب في كل محافظات عُمان. اختر الملعب والوقت، وأكّد حجزك في دقيقة.</p>
        </div>
      </section>

      <div className="vsearch">
        <div className="f">
          <label>المحافظة</label>
          <select value={gov} onChange={(e) => setGov(e.target.value)}>
            <option value="">كل المحافظات</option>
            {OMAN_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="f">
          <label>الرياضة</label>
          <select value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="">كل الألعاب</option>
            {sports.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="f">
          <label>ابحث بالاسم</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اسم الملعب أو الولاية" />
        </div>
        <button className="go" onClick={() => { if (typeof window !== "undefined") window.scrollTo({ top: 360, behavior: "smooth" }); }}>
          ابحث
        </button>
      </div>

      <main className="vwrap">
        <div className="vsec-h">
          <h2>الملاعب المتاحة</h2>
          <span className="n">{loading ? "يتم التحميل…" : `${list.length} ملعب`}</span>
        </div>

        {loading ? null : list.length === 0 ? (
          <div className="empty">لا توجد ملاعب مطابقة لبحثك. جرّب محافظة أو لعبة أخرى.</div>
        ) : (
          <div className="vgrid">
            {list.map((s) => {
              const img = firstImage(s.images);
              return (
                <article className="vcard" key={s.id}>
                  <div className="ph">
                    {img ? <img src={img} alt={s.name} /> : <span className="ball">⚽</span>}
                    <span className="price">{priceFmt(s.rent)}<small> / ساعة</small></span>
                    {s.sport ? <span className="sport">{s.sport}</span> : null}
                  </div>
                  <div className="body">
                    <h3>{s.name}</h3>
                    <div className="loc">📍 {s.mohafada}{s.wiliya ? ` — ${s.wiliya}` : ""}</div>
                    {s.features_label ? <div className="feat">{s.features_label}</div> : null}
                    {s.start_time && s.end_time
                      ? <div className="hours">يفتح {s.start_time} — {s.end_time}</div>
                      : null}
                    <button className="book" onClick={() => setActive(s)}>احجز</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="vfoot">طموح · حجز الملاعب في سلطنة عُمان</footer>

      {active ? (
        <BookingModal stadium={active} onClose={() => setActive(null)} onBooked={(m) => { setActive(null); showToast(m); }} />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}

function BookingModal({ stadium, onClose, onBooked }) {
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [sel, setSel] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoadingSlots(true); setSel(null);
    gql(SLOTS, { id: stadium.id, d: date })
      .then((d) => setSlots(d.availableTimeSlots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [stadium.id, date]);

  const canBook = sel && name.trim() && phone.trim() && !saving;

  const confirm = async () => {
    if (!canBook) return;
    setSaving(true); setErr("");
    try {
      await gql(BOOK, {
        c: {
          full_name: name.trim(),
          phone: phone.trim(),
          booking_date: date,
          booking_start: sel.start_time,
          booking_end: sel.end_time,
          id_stadium: stadium.id,
        },
      });
      onBooked("تم إرسال حجزك — سيتواصل معك الملعب لتأكيده");
    } catch (e) {
      setErr(e.message || "تعذّر إتمام الحجز، جرّب فترة أخرى");
      setSaving(false);
    }
  };

  return (
    <div className="vmodal-back" onClick={onClose}>
      <div className="vmodal" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="إغلاق">×</button>
        <h2>{stadium.name}</h2>
        <p className="sub">📍 {stadium.mohafada}{stadium.wiliya ? ` — ${stadium.wiliya}` : ""} · {priceFmt(stadium.rent)} للساعة</p>

        <div className="chips">
          {stadium.sport ? <span className="vchip">{stadium.sport}</span> : null}
          {stadium.start_time && stadium.end_time ? <span className="vchip">يفتح {stadium.start_time}—{stadium.end_time}</span> : null}
          {stadium.features_label ? <span className="vchip">{stadium.features_label}</span> : null}
        </div>
        {stadium.about ? <p className="sub">{stadium.about}</p> : null}

        <div className="lbl">اختر اليوم</div>
        <input type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} />

        <div className="lbl">الفترات المتاحة</div>
        {loadingSlots ? (
          <div className="empty">يتم تحميل الفترات…</div>
        ) : slots.length === 0 ? (
          <div className="empty">لا توجد فترات لهذا اليوم. جرّب يومًا آخر.</div>
        ) : (
          <div className="vslots">
            {slots.map((sl, i) => {
              const picked = sel && sel.start_time === sl.start_time;
              const cls = !sl.is_available ? "vslot off" : picked ? "vslot sel" : "vslot on";
              return (
                <button key={i} className={cls} disabled={!sl.is_available}
                  onClick={() => setSel(sl)}>
                  {sl.label || sl.start_time}
                  <small>{sl.price != null ? priceFmt(sl.price) : ""}</small>
                </button>
              );
            })}
          </div>
        )}

        <div className="lbl">بياناتك</div>
        <div className="vtwocol">
          <input type="text" placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="tel" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {err ? <div className="err">{err}</div> : null}

        <button className="vconfirm" disabled={!canBook} onClick={confirm}>
          {saving ? "جارٍ الحجز…" : sel ? `أكّد الحجز · ${sel.label || sel.start_time}` : "اختر فترة للحجز"}
        </button>
        <div className="vnote">لن يُخصم أي مبلغ الآن — الدفع في الملعب عند الحضور.</div>
      </div>
    </div>
  );
}
