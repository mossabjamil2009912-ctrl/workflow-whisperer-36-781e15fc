import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, FilePlus2, Save, Minus, Plus, Trash2, Check, Zap, Battery, Sun, Box, ShieldCheck, Server, Home, Cpu, Cable, Wrench, Printer, History, Share2, X } from "lucide-react";
import { listCatalog, listCustomers, saveQuote, listQuotes, sendAttachment } from "@/lib/crm.functions";
import logoClean from "@/assets/actes-logo-clean.png";

type Row = Awaited<ReturnType<typeof listCatalog>>[number];
type Line = { key: string; name: string; unit: string | null; price: number; qty: number; specs: string[] };

const TABLES: { k: string; t: string; i: typeof Zap }[] = [
  { k: "inverters", t: "الإنفرترات", i: Zap },
  { k: "batteries", t: "البطاريات", i: Battery },
  { k: "panels", t: "الألواح الشمسية", i: Sun },
  { k: "dc_boxes", t: "صناديق حماية DC", i: Box },
  { k: "ac_panel", t: "لوحات حماية AC", i: ShieldCheck },
  { k: "racks", t: "راكات وكبائن التخزين", i: Server },
  { k: "stands", t: "استندات المنظومات", i: Home },
  { k: "battery_controls", t: "كنترولات وحماية البطاريات", i: Cpu },
  { k: "cables", t: "الكنشات والكابلات", i: Cable },
  { k: "custom", t: "أصناف مخصصة وخدمات", i: Wrench },
];

const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const specsOf = (r: Row) => (Array.isArray(r.specs) ? (r.specs as unknown[]).map(String) : []);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const money = (n: number) => "$ " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const specLine = (s: string) => {
  const i = s.indexOf(":");
  return i > 0 && i < 60 ? `<b>${esc(s.slice(0, i + 1))}</b>${esc(s.slice(i + 1))}` : esc(s);
};

// نسخة طبق الأصل من قالب عرض سعر البوت (عقدة Build Quote HTML)
function quoteBody(no: string, cust: { name: string; phone: string; city: string }, lines: Line[], notes: string) {
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const o = location.origin;
  const d = new Date();
  const p2 = (n: number) => String(n).padStart(2, "0");
  const date = `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
  const h = d.getHours() % 12 || 12;
  const stamp = `${d.getHours() >= 12 ? "PM" : "AM"} ${p2(h)}:${p2(d.getMinutes())}:${p2(d.getSeconds())} ${date}`;
  const rows = lines.map((l, i) => `<tr><td class="c">${i + 1}</td><td class="nm"><div class="t">${esc(l.name)}</div>${l.specs.length ? `<div class="sp">${l.specs.map((s) => `<div>${specLine(s)}</div>`).join("")}</div>` : ""}</td><td class="c">${esc(l.unit ?? "حبة")}</td><td class="c">${l.qty}</td><td class="m">${money(l.price)}</td><td class="m">${money(l.price * l.qty)}</td></tr>`).join("");
  const noteList = [
    "الأسعار غير شاملة أعمال التركيب ما لم يُذكر خلاف ذلك.",
    ...(lines.some((l) => /كابل/.test(l.name)) ? ["كمية الكابل (1 متر) لتحديد سعر المتر، ويُحدد الطول الفعلي حسب مسافة الموقع."] : []),
    ...(notes ? [notes] : []),
  ];
  const css = `.qt{font-family:Cairo,sans-serif;color:#000;direction:rtl;width:190mm;margin:0 auto;font-size:11px;background:#fff}
  .qt .hdr{width:100%;display:block}
  .qt .info{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin:6px 4px 4px;font-size:12px;line-height:1.35}
  .qt .info div{display:flex;gap:6px}.qt .info span{min-width:92px}
  .qt table{width:100%;border-collapse:collapse}
  .qt th{background:#ed1c24;color:#000;font-weight:800;font-size:14px;border:1.5px solid #000;padding:1px 4px}
  .qt td{border:1.5px solid #000;vertical-align:top;padding:3px 5px}
  .qt td.c{text-align:center;font-weight:700}.qt td.m{text-align:left;direction:ltr;font-weight:700;white-space:nowrap}
  .qt .t{font-weight:800;font-size:13px;margin-bottom:8px}.qt .sp{font-size:10.5px;line-height:1.35}
  .qt tr{page-break-inside:avoid}
  .qt .tot td{background:#d9d9d9;font-weight:800;font-size:13px}.qt .tot td.m{color:#ed1c24;background:#fff}
  .qt .notes{font-size:9.5px;margin-top:6px;line-height:1.6}
  .qt .ft{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:16px;border-top:1px solid #000;padding-top:4px;font-size:8.5px;direction:ltr;font-weight:700}
  .qt .ft img{height:46px}`;
  const html = `<div class="qt"><img class="hdr" src="${o}/quote-header.jpg">
  <div class="info"><div><span>الأخـــوة /</span><b>${esc(cust.name || "...........")}</b></div><div><span>عملة العرض :</span>الدولار الأمريكي</div>
  <div><span>الموقع :</span>${esc(cust.city || "—")}</div><div><span>تاريخ عرض السعر :</span>${date}</div>
  <div><span>رقم الموبايل :</span><span dir="ltr" style="text-align:right">${esc(cust.phone ? "+" + cust.phone.replace(/^\+/, "") : "—")}</span></div><div><span>رقم عرض السعر :</span>${esc(no)}</div></div>
  <table><thead><tr><th style="width:22px">م</th><th>اســم الـصنـف والــمـــواصـفـــات</th><th style="width:58px">الوحدة</th><th style="width:58px">الكمية</th><th style="width:88px">السعر</th><th style="width:96px">الإجمالي</th></tr></thead>
  <tbody>${rows}<tr class="tot"><td colspan="5" style="text-align:center">الإجمالي</td><td class="m">${money(total)}</td></tr></tbody></table>
  <div class="notes">${noteList.map((n, i) => `${i === 0 ? "مـلاحـظــات: " : ""}${i + 1}. ${esc(n)}`).join("<br>")}</div>
  <div class="ft"><img src="${o}/quote-qr.jpg"><span>www.actesgroup.com &nbsp;&nbsp; email: info@actesgroup.com</span><span>طبع بواسطة : ACTES CRM</span><span>تاريخ التقرير : ${stamp}</span></div></div>`;
  return { css, html };
}

function quoteHtml(no: string, cust: { name: string; phone: string; city: string }, lines: Line[], notes: string) {
  const { css, html } = quoteBody(no, cust, lines, notes);
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(no)}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet"><style>@page{size:A4;margin:8mm 10mm}body{margin:0}${css}</style></head><body>${html}<script>document.fonts.ready.then(()=>setTimeout(()=>print(),300))</script></body></html>`;
}

async function quotePdfBase64(no: string, cust: { name: string; phone: string; city: string }, lines: Line[], notes: string) {
  const { css, html } = quoteBody(no, cust, lines, notes);
  // Isolated iframe: app styles use oklch() colors which html2canvas cannot parse.
  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:820px;height:1200px;border:0";
  document.body.appendChild(frame);
  try {
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap"><base href="${location.origin}/"><style>${css}</style></head><body style="margin:0;background:#fff">${html}</body></html>`);
    doc.close();
    await new Promise((r) => { if (doc.readyState === "complete") r(null); else frame.onload = () => r(null); setTimeout(r, 3000); });
    await doc.fonts.ready;
    await Promise.all([...doc.querySelectorAll("img")].map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; }))));
    // Render directly inside the iframe document so app (oklch) styles are never parsed.
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const el = doc.querySelector(".qt") as HTMLElement;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", window: frame.contentWindow! } as never);
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const mx = 10, my = 8, pw = 210 - mx * 2, ph = 297 - my * 2;
    const pxPerMm = canvas.width / pw, pagePx = Math.floor(ph * pxPerMm);
    for (let y = 0, i = 0; y < canvas.height; y += pagePx, i++) {
      const h = Math.min(pagePx, canvas.height - y);
      const c = document.createElement("canvas"); c.width = canvas.width; c.height = h;
      const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, h); ctx.drawImage(canvas, 0, -y);
      if (i) pdf.addPage();
      pdf.addImage(c.toDataURL("image/jpeg", 0.95), "JPEG", mx, my, pw, h / pxPerMm);
    }
    return pdf.output("datauristring").split(",")[1]!;
  } finally { frame.remove(); }
}

export function QuoteBuilder({ pw, initialCustomerId }: { pw: string; initialCustomerId?: string | null }) {
  const listC = useServerFn(listCatalog), listCu = useServerFn(listCustomers), save = useServerFn(saveQuote), sendA = useServerFn(sendAttachment), listQ = useServerFn(listQuotes);
  const { data: rows = [] } = useQuery({ queryKey: ["catalog"], queryFn: () => listC({ data: { pw } }) });
  const { data: customers = [] } = useQuery({ queryKey: ["quote-customers"], queryFn: () => listCu({ data: { pw } }) });
  const { data: quotes = [], refetch: refetchQ } = useQuery({ queryKey: ["quotes"], queryFn: () => listQ({ data: { pw } }) });

  const [active, setActive] = useState("inverters");
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Record<string, Line>>({});
  const [custId, setCustId] = useState<string | null>(initialCustomerId ?? null);
  const [cust, setCust] = useState({ name: "", phone: "", city: "" });
  const [notes, setNotes] = useState("");
  const [custom, setCustom] = useState({ name: "", price: "", unit: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [share, setShare] = useState(false);
  const [shareQ, setShareQ] = useState("");

  const items = useMemo(() => rows.filter((r) => r.kind === "item" && r.active), [rows]);
  const byCat = useMemo(() => {
    const m: Record<string, Row[]> = {};
    for (const r of items) (m[r.category] ??= []).push(r);
    return m;
  }, [items]);
  const list = (active === "custom" ? [] : byCat[active] ?? []).filter((r) => !q || (r.name + r.key).toLowerCase().includes(q.toLowerCase()));
  const chosen = Object.values(lines);
  const total = chosen.reduce((s, l) => s + l.price * l.qty, 0);
  const countIn = (k: string) => chosen.filter((l) => (k === "custom" ? l.key.startsWith("CUSTOM_") : byCat[k]?.some((r) => r.key === l.key))).length;

  const toggle = (r: Row) => setLines((p) => {
    const n = { ...p };
    if (n[r.key]) delete n[r.key];
    else n[r.key] = { key: r.key, name: r.name, unit: r.unit, price: Number(r.price ?? 0), qty: 1, specs: specsOf(r) };
    return n;
  });
  const setQty = (k: string, qty: number) => setLines((p) => (p[k] ? { ...p, [k]: { ...p[k], qty: Math.max(1, qty || 1) } } : p));
  const remove = (k: string) => setLines((p) => { const n = { ...p }; delete n[k]; return n; });
  const addCustom = () => {
    const price = Number(custom.price);
    if (!custom.name.trim() || !(price >= 0)) return;
    const key = "CUSTOM_" + Date.now();
    setLines((p) => ({ ...p, [key]: { key, name: custom.name.trim(), unit: custom.unit || null, price, qty: 1, specs: [] } }));
    setCustom({ name: "", price: "", unit: "" });
  };
  const pickCustomer = (id: string) => {
    setCustId(id || null);
    const c = customers.find((x) => x.id === id);
    if (c) setCust({ name: c.name ?? "", phone: c.phone, city: c.city ?? "" });
  };
  if (custId && !cust.phone) { const c = customers.find((x) => x.id === custId); if (c) setCust({ name: c.name ?? "", phone: c.phone, city: c.city ?? "" }); }

  const [no, setNo] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const generate = async () => {
    if (!chosen.length) return setMsg("اختر صنفا واحدا على الأقل");
    setBusy(true); setMsg("جارٍ إنشاء ملف PDF...");
    try {
      const num = no ?? "ACTES-Q-" + Date.now().toString().slice(-6);
      const b64 = await quotePdfBase64(num, cust, chosen, notes);
      const bin = atob(b64); const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([arr], { type: "application/pdf" }));
      a.download = `عرض سعر ${num} - ${cust.name || "عميل"}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setGenerated(true); setMsg("تم إنشاء وتحميل ملف PDF");
    } catch (e) { setMsg("تعذر إنشاء PDF: " + (e as Error).message); } finally { setBusy(false); }
  };
  void quoteHtml;
  const doShare = async (toId: string) => {
    setBusy(true); setMsg(null);
    try {
      const num = no ?? "ACTES-Q-" + Date.now().toString().slice(-6);
      const b64 = await quotePdfBase64(num, cust, chosen, notes);
      const to = customers.find((c) => c.id === toId);
      await sendA({ data: { pw, id: toId, text: `عرض سعر ${num}`, file_name: `عرض سعر ${num} - ${cust.name || "..........."}.pdf`, mime: "application/pdf", b64 } });
      setShare(false); setMsg(`تم إرسال عرض السعر إلى ${to?.name || to?.phone}`);
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const doSave = async () => {
    if (!chosen.length) return setMsg("اختر صنفا واحدا على الأقل");
    setBusy(true); setMsg(null);
    try {
      const r = await save({ data: { pw, customer_id: custId, customer_name: cust.name || null, phone: cust.phone || null, city: cust.city || null, notes: notes || null, items: chosen } });
      setNo(r.quote_no); setMsg(`تم الحفظ: ${r.quote_no}`); void refetchQ();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const loadQuote = (qt: (typeof quotes)[number]) => {
    const its = (qt.items as unknown as Line[]) ?? [];
    setLines(Object.fromEntries(its.map((l) => [l.key, l])));
    setCustId(qt.customer_id); setCust({ name: qt.customer_name ?? "", phone: qt.phone ?? "", city: qt.city ?? "" });
    setNotes(qt.notes ?? ""); setNo(qt.quote_no); setShowHist(false);
  };

  return (
    <div className="grid gap-3 p-3 lg:h-full lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold"><FilePlus2 className="h-5 w-5 text-primary" />إنشاء عرض سعر</h2>
          <button onClick={() => setShowHist((v) => !v)} className="mr-auto flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-muted/70"><History className="h-4 w-4" />العروض المحفوظة ({quotes.length})</button>
        </div>
        {showHist && (
          <div className="max-h-56 overflow-y-auto rounded-xl border bg-muted/30 p-2 animate-in fade-in slide-in-from-top-2">
            {quotes.length === 0 ? <p className="p-3 text-center text-sm text-muted-foreground">لا توجد عروض محفوظة</p> : quotes.map((qt) => (
              <button key={qt.id} onClick={() => loadQuote(qt)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-sm hover:bg-card">
                <span className="font-bold text-primary">{qt.quote_no}</span><span className="flex-1 truncate">{qt.customer_name || qt.phone || "-"}</span><span className="font-semibold">{usd(Number(qt.total))}</span>
              </button>))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {TABLES.map((t) => { const n = countIn(t.k), all = t.k === "custom" ? 0 : byCat[t.k]?.length ?? 0; return (
            <button key={t.k} onClick={() => { setActive(t.k); setQ(""); }}
              className={`group relative flex items-center gap-1.5 rounded-lg border px-2 py-1 text-right transition-all duration-200 hover:shadow-md ${active === t.k ? "border-primary bg-primary text-primary-foreground shadow" : "bg-card"}`}>
              <t.i className={`h-3.5 w-3.5 shrink-0 ${active === t.k ? "" : "text-primary"}`} />
              <span className="truncate text-[11px] font-bold leading-tight">{t.t}</span>
              <span className="mr-auto shrink-0 text-[9px] opacity-70">{t.k === "custom" ? "حر" : all}</span>
              {n > 0 && <span className="absolute -top-1.5 -left-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-in zoom-in">{n}</span>}
            </button>); })}
        </div>

        <div key={active} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2 border-b bg-muted/40 p-2.5">
            <span className="font-bold">{TABLES.find((t) => t.k === active)?.t}</span>
            {active !== "custom" && <label className="mr-auto flex items-center gap-1 rounded-lg border bg-background px-2"><Search className="h-4 w-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="w-36 bg-transparent py-1 text-sm outline-none" /></label>}
          </div>
          {active === "custom" ? (
            <div className="grid gap-2 p-3 sm:grid-cols-[1fr_110px_90px_auto]">
              <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="اسم الصنف أو الخدمة (مثل أجور التركيب)" className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <input value={custom.price} onChange={(e) => setCustom({ ...custom, price: e.target.value })} type="number" min={0} placeholder="السعر $" className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <input value={custom.unit} onChange={(e) => setCustom({ ...custom, unit: e.target.value })} placeholder="الوحدة" className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <button onClick={addCustom} className="flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />إضافة</button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card text-xs text-muted-foreground"><tr className="border-b"><th className="w-10 p-2" /><th className="p-2 text-right">الصنف</th><th className="p-2 text-right">السعر</th><th className="w-40 p-2 text-right">الكمية</th></tr></thead>
                <tbody>
                  {list.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">لا توجد أصناف</td></tr>}
                  {list.map((r) => { const l = lines[r.key]; const sp = specsOf(r); return (
                    <tr key={r.key} onClick={() => toggle(r)} className={`cursor-pointer border-b transition-colors ${l ? "bg-primary/10" : "hover:bg-muted/50"}`}>
                      <td className="p-2"><span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${l ? "border-primary bg-primary text-primary-foreground scale-110" : "border-muted-foreground/40"}`}>{l && <Check className="h-3.5 w-3.5" />}</span></td>
                      <td className="p-2"><div className="font-semibold">{r.name}</div>{sp.length > 0 && <div className="line-clamp-1 text-[11px] text-muted-foreground">{sp.slice(0, 3).join(" · ")}</div>}</td>
                      <td className="whitespace-nowrap p-2 font-bold text-primary">{r.price != null ? usd(Number(r.price)) : "-"}{r.unit && <span className="text-[10px] font-normal text-muted-foreground"> / {r.unit}</span>}</td>
                      <td className="p-2" onClick={(e) => l && e.stopPropagation()}>
                        {l && (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                            <button onClick={() => setQty(r.key, l.qty - 1)} className="rounded-md bg-muted p-1"><Minus className="h-3.5 w-3.5" /></button>
                            <input type="number" min={1} value={l.qty} onChange={(e) => setQty(r.key, Number(e.target.value))} autoFocus className="w-14 rounded-md border bg-background px-1 py-0.5 text-center text-sm font-bold" />
                            <button onClick={() => setQty(r.key, l.qty + 1)} className="rounded-md bg-muted p-1"><Plus className="h-3.5 w-3.5" /></button>
                          </div>)}
                      </td>
                    </tr>); })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-1.5 rounded-xl border bg-card p-2 shadow-sm">
        <select value={custId ?? ""} onChange={(e) => pickCustomer(e.target.value)} className="rounded-md border bg-background px-2 py-1 text-xs">
          <option value="">— العميل: جديد / بدون —</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name || c.phone} {c.name ? `(${c.phone})` : ""}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-1">
          <input value={cust.name} onChange={(e) => setCust({ ...cust, name: e.target.value })} placeholder="الاسم" className="min-w-0 rounded-md border bg-background px-1.5 py-1 text-xs" />
          <input value={cust.city} onChange={(e) => setCust({ ...cust, city: e.target.value })} placeholder="المدينة" className="min-w-0 rounded-md border bg-background px-1.5 py-1 text-xs" />
          <input dir="ltr" value={cust.phone} onChange={(e) => setCust({ ...cust, phone: e.target.value })} placeholder="الهاتف" className="min-w-0 rounded-md border bg-background px-1.5 py-1 text-xs" />
        </div>
        <h3 className="flex items-center justify-between text-sm font-bold">الأصناف المختارة <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{chosen.length}</span></h3>
        <ul className="min-h-40 flex-1 space-y-1 overflow-y-auto">
          {chosen.length === 0 && <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">اضغط على أي صنف من الجداول لإضافته</li>}
          {chosen.map((l) => (
            <li key={l.key} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs animate-in fade-in slide-in-from-left-2">
              <div className="min-w-0 flex-1"><div className="truncate font-semibold">{l.name}</div><div className="text-[10px] text-muted-foreground">{l.qty} × {usd(l.price)}</div></div>
              <b className="text-primary">{usd(l.qty * l.price)}</b>
              <button onClick={() => remove(l.key)} className="rounded p-0.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>))}
        </ul>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات على العرض (اختياري)" className="rounded-md border bg-background px-2 py-1 text-xs" />
        <div className="flex items-center justify-between rounded-lg bg-ink px-3 py-1.5 text-ink-foreground">
          <span className="text-xs">الإجمالي</span><span className="text-base font-extrabold text-primary">{usd(total)}</span>
        </div>
        {msg && <p className="text-center text-xs font-semibold text-primary">{msg}</p>}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={generate} className="flex items-center justify-center gap-1 rounded-md bg-primary py-1.5 text-xs font-bold text-primary-foreground shadow transition hover:opacity-90"><Printer className="h-3.5 w-3.5" />إنشاء عرض السعر</button>
          <button onClick={() => (chosen.length ? setShare(true) : setMsg("اختر صنفا واحدا على الأقل"))} disabled={busy} className="flex items-center justify-center gap-1 rounded-md bg-ink py-1.5 text-xs font-bold text-ink-foreground transition hover:opacity-90 disabled:opacity-50"><Share2 className="h-3.5 w-3.5" />{busy && share ? "جارٍ الإرسال..." : "مشاركة مع عميل"}</button>
        </div>
        {share && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={() => !busy && setShare(false)}>
            <div className="flex max-h-[80vh] w-full max-w-md flex-col gap-2 rounded-xl bg-card p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between"><b>إرسال عرض السعر PDF إلى</b><button onClick={() => setShare(false)}><X className="h-4 w-4" /></button></div>
              <input value={shareQ} onChange={(e) => setShareQ(e.target.value)} placeholder="بحث بالاسم أو الرقم" className="rounded-lg border bg-background px-3 py-2 text-sm" />
              <div className="min-h-0 flex-1 overflow-y-auto">
                {customers.filter((c) => !shareQ || ((c.name ?? "") + c.phone).includes(shareQ)).map((c) => (
                  <button key={c.id} disabled={busy} onClick={() => doShare(c.id)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-right text-sm hover:bg-muted disabled:opacity-50">
                    <span className="font-semibold">{c.name || "بدون اسم"}</span><span dir="ltr" className="text-xs text-muted-foreground">{c.phone}</span>
                  </button>))}
              </div>
              {busy && <p className="text-center text-xs text-primary">جارٍ إنشاء الملف وإرساله...</p>}
            </div>
          </div>
        )}
        {generated && (
          <button onClick={doSave} disabled={busy} className="flex items-center justify-center gap-1 rounded-md border-2 border-primary py-1 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:opacity-50 animate-in fade-in"><Save className="h-3.5 w-3.5" />{busy ? "جارٍ الحفظ..." : "حفظ عرض السعر"}</button>
        )}
      </aside>
    </div>
  );
}
