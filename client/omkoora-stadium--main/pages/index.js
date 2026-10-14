import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { gql, getToken, clearToken } from "../lib/api";

const ME = `{ currentUser { id email role } }`;
const MY_STADIUMS = `{ myStadiums { id name about rent start_time end_time } }`;
const MY_RESERVATIONS = `{
  myStadiumReservations {
    id full_name phone booking_date booking_start booking_end status
    duration_minutes total_price stadium { id name }
  }
}`;
const MY_NOTIFS = `{ allNotificationUser { id body isRead createdAt } }`;
const CREATE_STADIUM = `mutation ($content: contentStadium!) { createStadium(content: $content) { id } }`;
const UPDATE_STADIUM = `mutation ($id: ID!, $content: contentStadium!) { updateStadium(id: $id, content: $content) { status } }`;
const DELETE_STADIUM = `mutation ($id: ID!) { deleteStadium(id: $id) { status } }`;
const SET_RES_STATUS = `mutation ($id: ID!, $status: String!) { updateReservationStatus(id: $id, status: $status) { status } }`;
const MARK_READ = `mutation { markMyNotificationsAsRead }`;

const resBadge = (s) =>
  s === "accepted" ? ["b-green", "مقبول"] : s === "cancel" ? ["b-red", "ملغي"] : ["b-amber", "قيد الانتظار"];

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("stadiums");
  const [stadiums, setStadiums] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(null); // stadium object or {} for new
  const [busy, setBusy] = useState(false);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const loadAll = useCallback(async () => {
    try {
      const [s, r, n] = await Promise.all([gql(MY_STADIUMS), gql(MY_RESERVATIONS), gql(MY_NOTIFS)]);
      setStadiums(s.myStadiums || []);
      setReservations(r.myStadiumReservations || []);
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

  const saveStadium = async (form) => {
    setBusy(true);
    try {
      const content = {
        name: form.name,
        about: form.about || "-",
        attachments: "-",
        rent: parseFloat(form.rent) || 0,
        start_time: form.start_time || "08:00",
        end_time: form.end_time || "20:00",
      };
      if (editing.id) {
        await gql(UPDATE_STADIUM, { id: editing.id, content });
        flash("تم تحديث الملعب");
      } else {
        content.id_user = me.id; // assign ownership to the signed-in owner
        await gql(CREATE_STADIUM, { content });
        flash("تمت إضافة الملعب");
      }
      setEditing(null);
      await loadAll();
    } catch (e) {
      flash("خطأ: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeStadium = async (id) => {
    if (!confirm("حذف هذا الملعب؟")) return;
    try { await gql(DELETE_STADIUM, { id }); flash("تم الحذف"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  const setRes = async (id, status) => {
    try { await gql(SET_RES_STATUS, { id, status }); flash(status === "accepted" ? "تم قبول الحجز" : "تم إلغاء الحجز"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  const markRead = async () => { try { await gql(MARK_READ); await loadAll(); } catch (e) { flash(e.message); } };

  if (loading) return <div className="empty" style={{ marginTop: 80 }}>جارٍ التحميل…</div>;

  const waiting = reservations.filter((r) => r.status === "waiting").length;
  const revenue = reservations.filter((r) => r.status === "accepted").reduce((a, r) => a + (r.total_price || 0), 0);
  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="topbar">
        <div className="brand"><span className="dot" /> لوحة صاحب الملعب · طموح</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, opacity: .9 }}>{me?.email}</span>
          <button className="btn sm" onClick={logout}>خروج</button>
        </div>
      </div>

      <div className="container">
        <div className="kpis">
          <div className="kpi"><div className="n">{stadiums.length}</div><div className="l">ملاعبي</div></div>
          <div className="kpi"><div className="n">{waiting}</div><div className="l">حجوزات قيد الانتظار</div></div>
          <div className="kpi"><div className="n">{revenue.toFixed(2)}</div><div className="l">إيراد الحجوزات المقبولة (ر.ع)</div></div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "stadiums" ? "active" : ""}`} onClick={() => setTab("stadiums")}>ملاعبي <span className="count">{stadiums.length}</span></button>
          <button className={`tab ${tab === "reservations" ? "active" : ""}`} onClick={() => setTab("reservations")}>الحجوزات <span className="count">{reservations.length}</span></button>
          <button className={`tab ${tab === "notifs" ? "active" : ""}`} onClick={() => setTab("notifs")}>الإشعارات <span className="count">{unread}</span></button>
        </div>

        {tab === "stadiums" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>الملاعب</h3>
              <button className="btn primary" onClick={() => setEditing({})}>+ إضافة ملعب</button>
            </div>
            {stadiums.length === 0 ? (
              <div className="empty">لا توجد ملاعب بعد. أضف ملعبك الأول.</div>
            ) : (
              <div className="grid">
                {stadiums.map((s) => (
                  <div className="card" key={s.id}>
                    <h3>{s.name}</h3>
                    <div className="meta">{s.about && s.about !== "-" ? s.about : "—"}</div>
                    <div className="meta">السعر/الساعة: <b>{s.rent} ر.ع</b></div>
                    <div className="meta">ساعات العمل: {s.start_time || "—"} – {s.end_time || "—"}</div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <button className="btn sm" onClick={() => setEditing(s)}>تعديل</button>
                      <button className="btn sm red" onClick={() => removeStadium(s.id)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "reservations" && (
          reservations.length === 0 ? (
            <div className="empty">لا توجد حجوزات بعد.</div>
          ) : (
            <div className="grid">
              {reservations.map((r) => {
                const [bc, bl] = resBadge(r.status);
                return (
                  <div className="card" key={r.id}>
                    <div className="row"><h3>{r.full_name || "عميل"}</h3><span className={`badge ${bc}`}>{bl}</span></div>
                    <div className="meta">الملعب: {r.stadium?.name || "—"}</div>
                    <div className="meta">الهاتف: {r.phone || "—"}</div>
                    <div className="meta">التاريخ: {r.booking_date} · {r.booking_start}–{r.booking_end}</div>
                    <div className="meta">المدة: {r.duration_minutes || "—"} دقيقة · الإجمالي: <b>{r.total_price ?? "—"} ر.ع</b></div>
                    {r.status === "waiting" && (
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn sm green" onClick={() => setRes(r.id, "accepted")}>قبول</button>
                        <button className="btn sm red" onClick={() => setRes(r.id, "cancel")}>رفض</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

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
                <div className="card" key={n.id} style={{ marginBottom: 8, borderInlineStart: `4px solid ${n.isRead ? "#cbd5e1" : "#0f766e"}` }}>
                  <div>{n.body}</div>
                  <div className="meta" style={{ marginTop: 4 }}>{n.createdAt}</div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {editing && (
        <StadiumForm
          initial={editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={saveStadium}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function StadiumForm({ initial, onCancel, onSave, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    about: initial.about && initial.about !== "-" ? initial.about : "",
    rent: initial.rent ?? "",
    start_time: initial.start_time || "08:00",
    end_time: initial.end_time || "20:00",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial.id ? "تعديل الملعب" : "إضافة ملعب"}</h2>
        <div className="field">
          <label>اسم الملعب *</label>
          <input value={form.name} onChange={set("name")} placeholder="ملعب الطموح" />
        </div>
        <div className="field">
          <label>الوصف / الموقع</label>
          <textarea rows={2} value={form.about} onChange={set("about")} placeholder="وصف الملعب وموقعه" />
        </div>
        <div className="form-grid">
          <div className="field">
            <label>سعر الساعة (ر.ع) *</label>
            <input type="number" step="0.5" value={form.rent} onChange={set("rent")} placeholder="15" />
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <div style={{ fontSize: 12, color: "#5b7079", padding: "10px 0" }}>الحجز يُحسب: السعر × المدة</div>
          </div>
          <div className="field">
            <label>بداية العمل</label>
            <input type="time" value={form.start_time} onChange={set("start_time")} />
          </div>
          <div className="field">
            <label>نهاية العمل</label>
            <input type="time" value={form.end_time} onChange={set("end_time")} />
          </div>
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button className="btn primary" onClick={() => onSave(form)} disabled={busy || !form.name}>
            {busy ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
