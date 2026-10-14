import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { gql, gqlUpload, getToken, clearToken, imageUrl, OMAN_GOVERNORATES } from "../lib/api";

const ME = `{ currentUser { id email role } }`;
const MY_ACADEMIES = `{ myAcademies { id name about logo images phone email mohafada wiliya } }`;
const MY_PROGRAMS = `{
  myAcademyPrograms { id name age_category schedule about price id_academy academy { id name } }
}`;
const MY_NEWS = `{
  myAcademyNews { id title body image id_academy academy { id name } createdAt }
}`;
const MY_REGS = `{
  myAcademyRegistrations {
    id full_name phone child_birth_date age status payment_status note
    id_academy id_program academy { id name } program { id name } createdAt
  }
}`;
const MY_REPORT = `{ myAcademyReport { id_program program_name total waiting accepted rejected } }`;
const MY_NOTIFS = `{ allNotificationUser { id body isRead createdAt } }`;

const CREATE_ACADEMY = `mutation ($content: contentAcademy!) { createAcademy(content: $content) { id } }`;
const UPDATE_ACADEMY = `mutation ($id: ID!, $content: contentAcademy!) { updateAcademy(id: $id, content: $content) { status } }`;
const DELETE_ACADEMY = `mutation ($id: ID!) { deleteAcademy(id: $id) { status } }`;
const CREATE_PROGRAM = `mutation ($content: contentAcademyProgram!) { createAcademyProgram(content: $content) { id } }`;
const UPDATE_PROGRAM = `mutation ($id: ID!, $content: contentAcademyProgram!) { updateAcademyProgram(id: $id, content: $content) { status } }`;
const DELETE_PROGRAM = `mutation ($id: ID!) { deleteAcademyProgram(id: $id) { status } }`;
const CREATE_NEWS = `mutation ($content: contentAcademyNews!) { createAcademyNews(content: $content) { id } }`;
const UPDATE_NEWS = `mutation ($id: ID!, $content: contentAcademyNews!) { updateAcademyNews(id: $id, content: $content) { status } }`;
const DELETE_NEWS = `mutation ($id: ID!) { deleteAcademyNews(id: $id) { status } }`;
const SET_REG_STATUS = `mutation ($id: ID!, $status: String!) { updateAcademyRegistrationStatus(id: $id, status: $status) { status } }`;
const SET_REG_PAYMENT = `mutation ($id: ID!, $payment_status: String!, $note: String) { updateAcademyRegistrationPayment(id: $id, payment_status: $payment_status, note: $note) { status } }`;
const MARK_READ = `mutation { markMyNotificationsAsRead }`;

const regBadge = (s) =>
  s === "accepted" ? ["b-green", "مقبول"] : s === "rejected" ? ["b-red", "مرفوض"] : ["b-amber", "قيد الانتظار"];
const payBadge = (p) => (p === "paid" ? ["b-green", "مدفوع"] : ["b-gray", "غير مدفوع"]);

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("academy");
  const [academies, setAcademies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [news, setNews] = useState([]);
  const [regs, setRegs] = useState([]);
  const [report, setReport] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [editAcademy, setEditAcademy] = useState(null);
  const [editProgram, setEditProgram] = useState(null);
  const [editNews, setEditNews] = useState(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2800); };

  const loadAll = useCallback(async () => {
    try {
      const [a, p, nw, r, rep, n] = await Promise.all([
        gql(MY_ACADEMIES), gql(MY_PROGRAMS), gql(MY_NEWS), gql(MY_REGS), gql(MY_REPORT), gql(MY_NOTIFS),
      ]);
      setAcademies(a.myAcademies || []);
      setPrograms(p.myAcademyPrograms || []);
      setNews(nw.myAcademyNews || []);
      setRegs(r.myAcademyRegistrations || []);
      setReport(rep.myAcademyReport || []);
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

  // ---- Academy ----
  const saveAcademy = async (form, logoFile, imageFiles) => {
    setBusy(true);
    try {
      const content = {
        name: form.name,
        about: form.about || "",
        phone: form.phone || "",
        email: form.email || "",
        mohafada: form.mohafada || "",
        wiliya: form.wiliya || "",
      };
      const files = [];
      if (logoFile) { content.logo = null; files.push({ path: "content.logo", file: logoFile }); }
      if (imageFiles && imageFiles.length) {
        content.images = imageFiles.map(() => null);
        imageFiles.forEach((f, i) => files.push({ path: `content.images.${i}`, file: f }));
      }
      const run = (q, vars) => (files.length ? gqlUpload(q, vars, files) : gql(q, vars));
      if (editAcademy.id) {
        await run(UPDATE_ACADEMY, { id: editAcademy.id, content });
        flash("تم تحديث الأكاديمية");
      } else {
        await run(CREATE_ACADEMY, { content });
        flash("تمت إضافة الأكاديمية");
      }
      setEditAcademy(null);
      await loadAll();
    } catch (e) { flash("خطأ: " + e.message); } finally { setBusy(false); }
  };

  const removeAcademy = async (id) => {
    if (!confirm("حذف هذه الأكاديمية؟ سيُحذف معها كل ما يتبعها.")) return;
    try { await gql(DELETE_ACADEMY, { id }); flash("تم الحذف"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  // ---- Program ----
  const saveProgram = async (form) => {
    setBusy(true);
    try {
      const content = {
        name: form.name,
        age_category: form.age_category || "",
        schedule: form.schedule || "",
        about: form.about || "",
        price: parseFloat(form.price) || 0,
      };
      if (editProgram.id) {
        await gql(UPDATE_PROGRAM, { id: editProgram.id, content });
        flash("تم تحديث البرنامج");
      } else {
        content.id_academy = form.id_academy;
        await gql(CREATE_PROGRAM, { content });
        flash("تمت إضافة البرنامج");
      }
      setEditProgram(null);
      await loadAll();
    } catch (e) { flash("خطأ: " + e.message); } finally { setBusy(false); }
  };

  const removeProgram = async (id) => {
    if (!confirm("حذف هذا البرنامج؟")) return;
    try { await gql(DELETE_PROGRAM, { id }); flash("تم الحذف"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  // ---- News ----
  const saveNews = async (form, imageFile) => {
    setBusy(true);
    try {
      const content = { title: form.title, body: form.body || "" };
      const files = [];
      if (imageFile) { content.image = null; files.push({ path: "content.image", file: imageFile }); }
      const run = (q, vars) => (files.length ? gqlUpload(q, vars, files) : gql(q, vars));
      if (editNews.id) {
        await run(UPDATE_NEWS, { id: editNews.id, content });
        flash("تم تحديث الخبر");
      } else {
        content.id_academy = form.id_academy;
        await run(CREATE_NEWS, { content });
        flash("تمت إضافة الخبر");
      }
      setEditNews(null);
      await loadAll();
    } catch (e) { flash("خطأ: " + e.message); } finally { setBusy(false); }
  };

  const removeNews = async (id) => {
    if (!confirm("حذف هذا الخبر؟")) return;
    try { await gql(DELETE_NEWS, { id }); flash("تم الحذف"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  // ---- Registrations ----
  const setRegStatus = async (id, status) => {
    try { await gql(SET_REG_STATUS, { id, status }); flash(status === "accepted" ? "تم قبول التسجيل" : "تم رفض التسجيل"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };
  const setRegPayment = async (id, payment_status) => {
    const note = payment_status === "paid" ? "دفع نقدي" : "";
    try { await gql(SET_REG_PAYMENT, { id, payment_status, note }); flash(payment_status === "paid" ? "تم تعليم الدفع" : "أُلغي الدفع"); await loadAll(); }
    catch (e) { flash("خطأ: " + e.message); }
  };

  const markRead = async () => { try { await gql(MARK_READ); await loadAll(); } catch (e) { flash(e.message); } };

  if (loading) return <div className="empty" style={{ marginTop: 80 }}>جارٍ التحميل…</div>;

  const waiting = regs.filter((r) => r.status === "waiting" || !r.status).length;
  const accepted = regs.filter((r) => r.status === "accepted").length;
  const unread = notifs.filter((n) => !n.isRead).length;
  const hasAcademy = academies.length > 0;

  return (
    <div>
      <div className="topbar">
        <div className="brand"><span className="dot" /> لوحة صاحب الأكاديمية · طموح</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, opacity: .9 }}>{me?.email}</span>
          <button className="btn sm" onClick={logout}>خروج</button>
        </div>
      </div>

      <div className="container">
        <div className="kpis">
          <div className="kpi"><div className="n">{academies.length}</div><div className="l">أكاديمياتي</div></div>
          <div className="kpi"><div className="n">{programs.length}</div><div className="l">البرامج</div></div>
          <div className="kpi"><div className="n">{waiting}</div><div className="l">تسجيلات قيد الانتظار</div></div>
          <div className="kpi"><div className="n">{accepted}</div><div className="l">تسجيلات مقبولة</div></div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "academy" ? "active" : ""}`} onClick={() => setTab("academy")}>الأكاديمية <span className="count">{academies.length}</span></button>
          <button className={`tab ${tab === "programs" ? "active" : ""}`} onClick={() => setTab("programs")}>البرامج <span className="count">{programs.length}</span></button>
          <button className={`tab ${tab === "news" ? "active" : ""}`} onClick={() => setTab("news")}>الأخبار <span className="count">{news.length}</span></button>
          <button className={`tab ${tab === "regs" ? "active" : ""}`} onClick={() => setTab("regs")}>التسجيلات <span className="count">{regs.length}</span></button>
          <button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>التقرير</button>
          <button className={`tab ${tab === "notifs" ? "active" : ""}`} onClick={() => setTab("notifs")}>الإشعارات <span className="count">{unread}</span></button>
        </div>

        {/* ---- Academy ---- */}
        {tab === "academy" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>ملف الأكاديمية</h3>
              <button className="btn primary" onClick={() => setEditAcademy({})}>+ إضافة أكاديمية</button>
            </div>
            {!hasAcademy ? (
              <div className="empty">لا توجد أكاديمية بعد. أنشئ أكاديميتك الأولى.</div>
            ) : (
              <div className="grid">
                {academies.map((a) => {
                  const imgs = (a.images || "").split(",").map((s) => s.trim()).filter(Boolean);
                  return (
                    <div className="card" key={a.id}>
                      <div className="row" style={{ alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {a.logo ? <img className="logo-thumb" src={imageUrl(a.logo)} alt="" /> : null}
                          <div>
                            <h3 style={{ margin: 0 }}>{a.name}</h3>
                            <div className="meta">{[a.mohafada, a.wiliya].filter(Boolean).join(" · ") || "—"}</div>
                          </div>
                        </div>
                      </div>
                      <div className="meta" style={{ marginTop: 8 }}>{a.about && a.about !== "-" ? a.about : "—"}</div>
                      <div className="meta">الهاتف: {a.phone || "—"} · البريد: {a.email || "—"}</div>
                      {imgs.length ? (
                        <div className="thumbs">{imgs.map((im, i) => <img key={i} src={imageUrl(im)} alt="" />)}</div>
                      ) : null}
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn sm" onClick={() => setEditAcademy(a)}>تعديل</button>
                        <button className="btn sm red" onClick={() => removeAcademy(a.id)}>حذف</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---- Programs ---- */}
        {tab === "programs" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>البرامج التدريبية</h3>
              <button className="btn primary" disabled={!hasAcademy} onClick={() => setEditProgram({ id_academy: academies[0]?.id })}>+ إضافة برنامج</button>
            </div>
            {!hasAcademy ? (
              <div className="empty">أنشئ أكاديمية أولًا لإضافة البرامج.</div>
            ) : programs.length === 0 ? (
              <div className="empty">لا توجد برامج بعد.</div>
            ) : (
              <div className="grid">
                {programs.map((p) => (
                  <div className="card" key={p.id}>
                    <h3>{p.name}</h3>
                    {academies.length > 1 ? <div className="meta">الأكاديمية: {p.academy?.name || "—"}</div> : null}
                    <div className="meta">الفئة العمرية: {p.age_category || "—"}</div>
                    <div className="meta">الأوقات: {p.schedule || "—"}</div>
                    <div className="meta">السعر: <b>{p.price ?? 0} ر.ع</b></div>
                    {p.about ? <div className="meta">{p.about}</div> : null}
                    <div className="row" style={{ marginTop: 10 }}>
                      <button className="btn sm" onClick={() => setEditProgram(p)}>تعديل</button>
                      <button className="btn sm red" onClick={() => removeProgram(p.id)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- News ---- */}
        {tab === "news" && (
          <>
            <div className="row" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>الأخبار</h3>
              <button className="btn primary" disabled={!hasAcademy} onClick={() => setEditNews({ id_academy: academies[0]?.id })}>+ إضافة خبر</button>
            </div>
            {!hasAcademy ? (
              <div className="empty">أنشئ أكاديمية أولًا لنشر الأخبار.</div>
            ) : news.length === 0 ? (
              <div className="empty">لا توجد أخبار بعد.</div>
            ) : (
              <div className="grid">
                {news.map((n) => (
                  <div className="card" key={n.id}>
                    {n.image ? <img className="news-img" src={imageUrl(n.image)} alt="" /> : null}
                    <h3>{n.title}</h3>
                    {academies.length > 1 ? <div className="meta">الأكاديمية: {n.academy?.name || "—"}</div> : null}
                    <div className="meta">{n.body}</div>
                    <div className="meta" style={{ marginTop: 4 }}>{n.createdAt}</div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <button className="btn sm" onClick={() => setEditNews(n)}>تعديل</button>
                      <button className="btn sm red" onClick={() => removeNews(n.id)}>حذف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- Registrations ---- */}
        {tab === "regs" && (
          regs.length === 0 ? (
            <div className="empty">لا توجد تسجيلات بعد.</div>
          ) : (
            <div className="grid">
              {regs.map((r) => {
                const [bc, bl] = regBadge(r.status);
                const [pc, pl] = payBadge(r.payment_status);
                return (
                  <div className="card" key={r.id}>
                    <div className="row"><h3>{r.full_name || "ولي أمر"}</h3><span className={`badge ${bc}`}>{bl}</span></div>
                    <div className="meta">البرنامج: {r.program?.name || "—"}{academies.length > 1 ? ` · ${r.academy?.name || ""}` : ""}</div>
                    <div className="meta">الهاتف: {r.phone || "—"}</div>
                    <div className="meta">تاريخ ميلاد الطفل: {r.child_birth_date || "—"}{r.age ? ` · ${r.age} سنة` : ""}</div>
                    <div className="meta">الدفع: <span className={`badge ${pc}`}>{pl}</span>{r.note ? ` · ${r.note}` : ""}</div>
                    <div className="meta" style={{ marginTop: 2 }}>{r.createdAt}</div>
                    {(r.status === "waiting" || !r.status) && (
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn sm green" onClick={() => setRegStatus(r.id, "accepted")}>قبول</button>
                        <button className="btn sm red" onClick={() => setRegStatus(r.id, "rejected")}>رفض</button>
                      </div>
                    )}
                    {r.status === "accepted" && (
                      <div className="row" style={{ marginTop: 10 }}>
                        {r.payment_status === "paid" ? (
                          <button className="btn sm" onClick={() => setRegPayment(r.id, "unpaid")}>إلغاء الدفع</button>
                        ) : (
                          <button className="btn sm green" onClick={() => setRegPayment(r.id, "paid")}>تعليم مدفوع نقدًا</button>
                        )}
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
                <tr><th>البرنامج</th><th>الإجمالي</th><th>قيد الانتظار</th><th>مقبول</th><th>مرفوض</th></tr>
              </thead>
              <tbody>
                {report.map((row, i) => (
                  <tr key={row.id_program || `none-${i}`}>
                    <td>{row.program_name || "بدون برنامج"}</td>
                    <td><b>{row.total}</b></td>
                    <td>{row.waiting}</td>
                    <td style={{ color: "var(--green)" }}>{row.accepted}</td>
                    <td style={{ color: "var(--red)" }}>{row.rejected}</td>
                  </tr>
                ))}
                <tr>
                  <td><b>المجموع</b></td>
                  <td><b>{report.reduce((a, r) => a + (r.total || 0), 0)}</b></td>
                  <td>{report.reduce((a, r) => a + (r.waiting || 0), 0)}</td>
                  <td style={{ color: "var(--green)" }}>{report.reduce((a, r) => a + (r.accepted || 0), 0)}</td>
                  <td style={{ color: "var(--red)" }}>{report.reduce((a, r) => a + (r.rejected || 0), 0)}</td>
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

      {editAcademy && (
        <AcademyForm initial={editAcademy} busy={busy} onCancel={() => setEditAcademy(null)} onSave={saveAcademy} />
      )}
      {editProgram && (
        <ProgramForm initial={editProgram} academies={academies} busy={busy} onCancel={() => setEditProgram(null)} onSave={saveProgram} />
      )}
      {editNews && (
        <NewsForm initial={editNews} academies={academies} busy={busy} onCancel={() => setEditNews(null)} onSave={saveNews} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function AcademyForm({ initial, onCancel, onSave, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    about: initial.about && initial.about !== "-" ? initial.about : "",
    phone: initial.phone || "",
    email: initial.email || "",
    mohafada: initial.mohafada || "",
    wiliya: initial.wiliya || "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial.id ? "تعديل الأكاديمية" : "إضافة أكاديمية"}</h2>
        <div className="field">
          <label>اسم الأكاديمية *</label>
          <input value={form.name} onChange={set("name")} placeholder="أكاديمية الطموح" />
        </div>
        <div className="field">
          <label>نبذة</label>
          <textarea rows={2} value={form.about} onChange={set("about")} placeholder="وصف الأكاديمية" />
        </div>
        <div className="form-grid">
          <div className="field"><label>الهاتف</label><input value={form.phone} onChange={set("phone")} placeholder="9xxxxxxx" /></div>
          <div className="field"><label>البريد</label><input type="email" value={form.email} onChange={set("email")} placeholder="info@academy.com" /></div>
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
          <label>الشعار (صورة){initial.logo ? " — اتركه فارغًا للإبقاء على الحالي" : ""}</label>
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
        </div>
        <div className="field">
          <label>صور الأكاديمية (اختياري، عدة صور)</label>
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

function ProgramForm({ initial, academies, onCancel, onSave, busy }) {
  const [form, setForm] = useState({
    name: initial.name || "",
    age_category: initial.age_category || "",
    schedule: initial.schedule || "",
    about: initial.about || "",
    price: initial.price ?? "",
    id_academy: initial.id_academy || academies[0]?.id || "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial.id ? "تعديل البرنامج" : "إضافة برنامج"}</h2>
        {!initial.id && academies.length > 1 && (
          <div className="field">
            <label>الأكاديمية *</label>
            <select value={form.id_academy} onChange={set("id_academy")}>
              {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>اسم البرنامج *</label>
          <input value={form.name} onChange={set("name")} placeholder="برنامج الناشئين" />
        </div>
        <div className="form-grid">
          <div className="field"><label>الفئة العمرية</label><input value={form.age_category} onChange={set("age_category")} placeholder="8 - 12 سنة" /></div>
          <div className="field"><label>السعر (ر.ع)</label><input type="number" step="0.5" value={form.price} onChange={set("price")} placeholder="30" /></div>
        </div>
        <div className="field">
          <label>الأوقات</label>
          <input value={form.schedule} onChange={set("schedule")} placeholder="السبت والإثنين 4–6 مساءً" />
        </div>
        <div className="field">
          <label>تفاصيل</label>
          <textarea rows={2} value={form.about} onChange={set("about")} placeholder="وصف مختصر للبرنامج" />
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button className="btn primary" onClick={() => onSave(form)} disabled={busy || !form.name || !form.id_academy}>
            {busy ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewsForm({ initial, academies, onCancel, onSave, busy }) {
  const [form, setForm] = useState({
    title: initial.title || "",
    body: initial.body || "",
    id_academy: initial.id_academy || academies[0]?.id || "",
  });
  const [imageFile, setImageFile] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial.id ? "تعديل الخبر" : "إضافة خبر"}</h2>
        {!initial.id && academies.length > 1 && (
          <div className="field">
            <label>الأكاديمية *</label>
            <select value={form.id_academy} onChange={set("id_academy")}>
              {academies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>العنوان *</label>
          <input value={form.title} onChange={set("title")} placeholder="عنوان الخبر" />
        </div>
        <div className="field">
          <label>النص</label>
          <textarea rows={3} value={form.body} onChange={set("body")} placeholder="تفاصيل الخبر" />
        </div>
        <div className="field">
          <label>صورة الخبر{initial.image ? " — اتركها فارغة للإبقاء على الحالية" : ""}</label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onCancel} disabled={busy}>إلغاء</button>
          <button className="btn primary" onClick={() => onSave(form, imageFile)} disabled={busy || !form.title || !form.id_academy}>
            {busy ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
