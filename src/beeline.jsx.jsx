import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
  Cell, PieChart, Pie
} from "recharts";

// ── Real data from Beeline KZ internal reports ──────────────────────────────
const MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

const churnData = [
  { m:"Янв", y2024:2.1, y2025:1.7 },
  { m:"Фев", y2024:2.9, y2025:2.0 },
  { m:"Мар", y2024:2.7, y2025:1.4 },
  { m:"Апр", y2024:2.3, y2025:1.5 },
  { m:"Май", y2024:2.1, y2025:1.4 },
  { m:"Июн", y2024:2.3, y2025:1.8 },
  { m:"Июл", y2024:2.2, y2025:1.7 },
  { m:"Авг", y2024:1.7, y2025:1.2 },
  { m:"Сен", y2024:1.8, y2025:1.0 },
  { m:"Окт", y2024:1.6, y2025:1.2 },
  { m:"Ноя", y2024:1.6, y2025:0.9 },
  { m:"Дек", y2024:2.6, y2025:2.0 },
];

const baseComposition = [
  { m:"Янв-25", fmc:76.9, fttb:15.0, fttbtv:8.1 },
  { m:"Фев-25", fmc:76.9, fttb:15.1, fttbtv:8.1 },
  { m:"Мар-25", fmc:76.8, fttb:15.1, fttbtv:8.1 },
  { m:"Апр-25", fmc:77.1, fttb:14.9, fttbtv:8.0 },
  { m:"Май-25", fmc:77.4, fttb:14.7, fttbtv:8.0 },
  { m:"Июн-25", fmc:77.5, fttb:14.5, fttbtv:8.0 },
  { m:"Июл-25", fmc:77.4, fttb:14.3, fttbtv:8.3 },
  { m:"Авг-25", fmc:76.0, fttb:14.5, fttbtv:9.6 },
  { m:"Сен-25", fmc:75.3, fttb:14.5, fttbtv:10.1 },
  { m:"Окт-25", fmc:74.1, fttb:14.5, fttbtv:11.4 },
  { m:"Ноя-25", fmc:72.0, fttb:14.7, fttbtv:13.4 },
  { m:"Дек-25", fmc:68.2, fttb:14.9, fttbtv:16.9 },
];

const churnBySegment = [
  { m:"Янв-25", fmc:32.0, fttb:54.3, fttbtv:13.7 },
  { m:"Фев-25", fmc:39.2, fttb:49.8, fttbtv:10.9 },
  { m:"Мар-25", fmc:36.7, fttb:51.8, fttbtv:11.5 },
  { m:"Апр-25", fmc:32.7, fttb:53.3, fttbtv:14.0 },
  { m:"Май-25", fmc:29.1, fttb:56.6, fttbtv:14.2 },
  { m:"Июн-25", fmc:32.1, fttb:53.5, fttbtv:14.4 },
  { m:"Июл-25", fmc:27.4, fttb:55.8, fttbtv:16.8 },
  { m:"Авг-25", fmc:33.7, fttb:61.5, fttbtv:4.8 },
  { m:"Сен-25", fmc:25.2, fttb:57.8, fttbtv:17.0 },
  { m:"Окт-25", fmc:38.0, fttb:53.3, fttbtv:8.7 },
  { m:"Ноя-25", fmc:46.5, fttb:44.5, fttbtv:9.0 },
  { m:"Дек-25", fmc:33.9, fttb:53.6, fttbtv:12.5 },
];

const churnReasons = [
  { reason:"Переезд, нет тех. возможности", pct:28, color:"#FF6B35", manageable:false },
  { reason:"Дорого", pct:21, color:"#E74C3C", manageable:true },
  { reason:"Качество интернета", pct:18, color:"#3498DB", manageable:true },
  { reason:"Сделал переподключение", pct:14, color:"#2ECC71", manageable:true },
  { reason:"Переезд, есть тех. возможности", pct:10, color:"#F39C12", manageable:true },
  { reason:"Временно нет потребности", pct:5, color:"#9B59B6", manageable:true },
  { reason:"Квартиранты", pct:3, color:"#1ABC9C", manageable:false },
  { reason:"Изменение цены", pct:1, color:"#95A5A6", manageable:true },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 0) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " млрд";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " млн";
  if (n >= 1e3) return (n / 1e3).toFixed(decimals > 0 ? decimals : 0) + " тыс.";
  return n.toFixed(decimals);
};
const fmtKZT = (n) => {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + " млрд ₸";
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + " млн ₸";
  return n.toLocaleString("ru-RU") + " ₸";
};
const fmtPct = (n) => n.toFixed(1) + "%";

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0D1117", border: "1px solid #30363D",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ color: "#8B949E", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <b>{typeof p.value === "number" ? (unit === "%" ? fmtPct(p.value) : fmtKZT(p.value)) : p.value}</b>
        </div>
      ))}
    </div>
  );
};

// ── Slider ────────────────────────────────────────────────────────────────────
const Slider = ({ label, value, min, max, step, onChange, format, color = "#FF6600", hint }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: "#8B949E" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "monospace" }}>{format(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: color, cursor: "pointer" }}
    />
    {hint && <div style={{ fontSize: 10, color: "#484F58", marginTop: 3 }}>{hint}</div>}
  </div>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KPICard = ({ label, value, sub, color = "#FF6600", icon, delta }) => (
  <div style={{
    background: "linear-gradient(135deg, #161B22 0%, #0D1117 100%)",
    border: "1px solid #21262D", borderRadius: 12, padding: "16px 18px",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, width: 3, height: "100%",
      background: color, borderRadius: "12px 0 0 12px"
    }} />
    <div style={{ fontSize: 11, color: "#8B949E", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.8px" }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#484F58", marginTop: 5 }}>{sub}</div>}
    {delta !== undefined && (
      <div style={{ fontSize: 11, color: delta >= 0 ? "#3FB950" : "#F85149", marginTop: 4 }}>
        {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs 2024
      </div>
    )}
  </div>
);

// ── Tab button ─────────────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "9px 18px", fontSize: 12, fontWeight: active ? 700 : 400,
    color: active ? "#FF6600" : "#8B949E",
    background: active ? "rgba(255,102,0,0.1)" : "transparent",
    border: active ? "1px solid rgba(255,102,0,0.3)" : "1px solid transparent",
    borderRadius: 8, cursor: "pointer", transition: "all .2s", letterSpacing: "0.3px",
  }}>{label}</button>
);

// ── Section header ────────────────────────────────────────────────────────────
const SectionHead = ({ title, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: "#E6EDF3" }}>{title}</div>
    {sub && <div style={{ fontSize: 11, color: "#8B949E", marginTop: 3 }}>{sub}</div>}
  </div>
);

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");

  // Interactive model params
  const [aab, setAab] = useState(600000);
  const [arpu, setArpu] = useState(5000);
  const [cogs, setCogs] = useState(1800);
  const [currentChurn, setCurrentChurn] = useState(1.5);
  const [targetChurn, setTargetChurn] = useState(0.7);
  const [retCost, setRetCost] = useState(1500);
  const [retConv, setRetConv] = useState(60);
  const [addressable, setAddressable] = useState(72);

  // Scenario
  const [scenario, setScenario] = useState("base");

  // Derived calculations
  const calc = useMemo(() => {
    const margin = arpu - cogs;
    const ltvCurrent = margin / (currentChurn / 100);
    const ltvTarget = margin / (targetChurn / 100);
    const lostPerMonth = Math.round(aab * (currentChurn / 100));
    const addressableChurn = currentChurn * (addressable / 100);
    const deltaPct = (currentChurn - targetChurn) / 100;
    const savedPerMonth = Math.round(aab * deltaPct);
    const reachNeeded = Math.round(savedPerMonth / (retConv / 100));
    const retCostTotal = reachNeeded * retCost;
    const revenueGain = savedPerMonth * arpu;
    const marginGain = savedPerMonth * margin;
    const netEffect = marginGain - retCostTotal;
    const roi = retCostTotal > 0 ? marginGain / retCostTotal : 0;
    const payback = retCost / margin;
    const ltvCac = ltvTarget / (2.4 * arpu);

    // 6-month AAB forecast
    const forecast = [];
    let aabBase = aab;
    let aabWith = aab;
    for (let m = 0; m <= 6; m++) {
      const retCostMonth = m === 0 ? 0 : reachNeeded * retCost;
      forecast.push({
        m: m === 0 ? "Сейчас" : `Мес. ${m}`,
        без_программы: Math.round(aabBase),
        с_программой: Math.round(aabWith),
        разница: Math.round(aabWith - aabBase),
        выручка_без: Math.round(aabBase * arpu / 1e6 * 10) / 10,
        выручка_с: Math.round(aabWith * arpu / 1e6 * 10) / 10,
      });
      if (m > 0) {
        aabBase = Math.round(aabBase * (1 - currentChurn / 100));
        aabWith = Math.round(aabWith * (1 - targetChurn / 100));
      }
    }

    return {
      margin, ltvCurrent, ltvTarget, lostPerMonth, savedPerMonth,
      reachNeeded, retCostTotal, revenueGain, marginGain, netEffect, roi,
      payback, forecast, ltvCac, addressableChurn,
      netYear: netEffect * 12,
    };
  }, [aab, arpu, cogs, currentChurn, targetChurn, retCost, retConv, addressable]);

  // Scenario params
  const scenarios = {
    pess: { label: "Пессимистичный", churn: 2.0, target: 1.2, retCost: 2200, conv: 45, color: "#F85149" },
    base: { label: "Реалистичный", churn: 1.5, target: 0.7, retCost: 1500, conv: 60, color: "#FF6600" },
    opt:  { label: "Оптимистичный", churn: 1.2, target: 0.5, retCost: 1200, conv: 72, color: "#3FB950" },
  };

  const scenarioCalc = (sc) => {
    const m = arpu - cogs;
    const saved = Math.round(aab * (sc.churn - sc.target) / 100);
    const reach = Math.round(saved / (sc.conv / 100));
    const cost = reach * sc.retCost;
    const mGain = saved * m;
    return {
      savedPerMonth: saved, retCostMonth: cost, marginGain: mGain,
      netMonth: mGain - cost, netYear: (mGain - cost) * 12,
      roi: cost > 0 ? mGain / cost : 0,
    };
  };

  const styles = {
    root: {
      background: "#0D1117", color: "#E6EDF3", fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      minHeight: "100vh", padding: "0 0 40px", fontSize: 13,
    },
    header: {
      background: "linear-gradient(135deg, #161B22 0%, #0D1117 100%)",
      borderBottom: "1px solid #21262D", padding: "20px 28px 16px",
    },
    body: { padding: "20px 28px" },
    card: {
      background: "#161B22", border: "1px solid #21262D", borderRadius: 12,
      padding: "18px 20px",
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
    grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 },
  };

  const avg2025 = (churnData.reduce((s, d) => s + d.y2025, 0) / 12).toFixed(1);
  const avg2024 = (churnData.reduce((s, d) => s + d.y2024, 0) / 12).toFixed(1);

  return (
    <div style={styles.root}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              background: "#FF6600", color: "#fff", fontWeight: 900,
              fontSize: 13, padding: "5px 12px", borderRadius: 6, letterSpacing: 1,
            }}>BEELINE KZ</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Финансовая модель оттока ААБ</div>
              <div style={{ fontSize: 11, color: "#8B949E" }}>Домашний интернет · Реальные данные 2025 · Интерактивная модель</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#484F58", textAlign: "right" }}>
            Источник: внутренние данные Beeline KZ<br/>Март 2026
          </div>
        </div>

        {/* KPI Row */}
        <div style={styles.grid4}>
          <KPICard label="Средний churn 2025" value={avg2025 + "%"} sub="против 2.17% в 2024" color="#FF6600" delta={-(parseFloat(avg2024) - parseFloat(avg2025))} />
          <KPICard label="Доля FTTB в оттоке" value="~53%" sub="при доле в базе 15% — аномалия ×3,5" color="#F85149" />
          <KPICard label="Управляемый отток" value="72%" sub="28% — переезд без тех. возм." color="#3FB950" />
          <KPICard label="Bundle снижает churn" value="FTTB+TV" sub="12% от оттока vs 17% в базе — bundle работает" color="#58A6FF" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 16, flexWrap: "wrap" }}>
          {[
            ["dashboard", "📊 Дашборд"],
            ["model", "💰 Финансовый эффект"],
            ["segments", "🎯 Сегменты"],
            ["scenarios", "📋 Сценарии"],
            ["forecast", "📈 Прогноз ААБ"],
          ].map(([id, label]) => (
            <Tab key={id} label={label} active={tab === id} onClick={() => setTab(id)} />
          ))}
        </div>
      </div>

      <div style={styles.body}>

        {/* ══ DASHBOARD ══════════════════════════════════════════════════════════ */}
        {tab === "dashboard" && (
          <div>
            <div style={styles.grid2}>
              {/* Churn trend */}
              <div style={styles.card}>
                <SectionHead title="Динамика оттока 2024 vs 2025" sub="Реальные ежемесячные данные Beeline KZ" />
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={churnData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                    <XAxis dataKey="m" tick={{ fill: "#8B949E", fontSize: 10 }} />
                    <YAxis tickFormatter={v => v + "%"} tick={{ fill: "#8B949E", fontSize: 10 }} domain={[0, 3.2]} />
                    <Tooltip content={<CustomTooltip unit="%" />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#8B949E" }} />
                    <ReferenceLine y={parseFloat(avg2025)} stroke="#FF6600" strokeDasharray="4 2" strokeWidth={1} label={{ value: `Ср. 2025: ${avg2025}%`, fill: "#FF6600", fontSize: 10, position: "right" }} />
                    <Line type="monotone" dataKey="y2024" name="2024" stroke="#484F58" strokeWidth={2} dot={{ r: 3, fill: "#484F58" }} />
                    <Line type="monotone" dataKey="y2025" name="2025" stroke="#FF6600" strokeWidth={2.5} dot={{ r: 3.5, fill: "#FF6600" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    { label: "Дек-25 аномалия", val: "2.0%", sub: "+1.1 п.п. за 2 мес.", color: "#F85149" },
                    { label: "Мин. 2025", val: "0.9%", sub: "Ноябрь", color: "#3FB950" },
                    { label: "Улучшение", val: "−0.67 п.п.", sub: "ср. churn г/г", color: "#58A6FF" },
                  ].map((s, i) => (
                    <div key={i} style={{ flex: 1, background: "#0D1117", borderRadius: 8, padding: "8px 10px", border: `1px solid ${s.color}33` }}>
                      <div style={{ fontSize: 10, color: "#8B949E" }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "#484F58" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reasons */}
              <div style={styles.card}>
                <SectionHead title="Причины оттока" sub="Средние значения янв–дек 2025" />
                <div>
                  {churnReasons.map((r, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: r.manageable ? "#E6EDF3" : "#8B949E" }}>
                          {!r.manageable && <span style={{ color: "#484F58", marginRight: 4 }}>🔒</span>}
                          {r.reason}
                        </span>
                        <span style={{ fontWeight: 700, color: r.color, fontFamily: "monospace", fontSize: 11 }}>{r.pct}%</span>
                      </div>
                      <div style={{ height: 5, background: "#21262D", borderRadius: 3 }}>
                        <div style={{ height: 5, width: `${r.pct}%`, background: r.color, borderRadius: 3, opacity: r.manageable ? 1 : 0.4 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <div style={{ flex: 1, background: "#0D1117", borderRadius: 8, padding: "8px 10px", border: "1px solid #3FB95044" }}>
                    <div style={{ fontSize: 10, color: "#8B949E" }}>Управляемый отток</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#3FB950", fontFamily: "monospace" }}>72%</div>
                    <div style={{ fontSize: 10, color: "#484F58" }}>потенциал retention</div>
                  </div>
                  <div style={{ flex: 1, background: "#0D1117", borderRadius: 8, padding: "8px 10px", border: "1px solid #F8514944" }}>
                    <div style={{ fontSize: 10, color: "#8B949E" }}>Неуправляемый</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#F85149", fontFamily: "monospace" }}>28%</div>
                    <div style={{ fontSize: 10, color: "#484F58" }}>переезд без тех. возм.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Base composition */}
            <div style={{ ...styles.card, marginTop: 16 }}>
              <SectionHead title="Состав базы: FMC → FTTB+TV миграция" sub="Доля типов подключений в ААБ, янв–дек 2025" />
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={baseComposition} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="m" tick={{ fill: "#8B949E", fontSize: 10 }} />
                  <YAxis tickFormatter={v => v + "%"} tick={{ fill: "#8B949E", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="fmc" name="FMC" stroke="#F5A623" fill="#F5A62320" strokeWidth={2} />
                  <Area type="monotone" dataKey="fttb" name="FTTB" stroke="#E74C3C" fill="#E74C3C20" strokeWidth={2} />
                  <Area type="monotone" dataKey="fttbtv" name="FTTB+TV" stroke="#95A5A6" fill="#95A5A620" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 2, background: "#0D1117", borderRadius: 8, padding: "8px 12px", border: "1px solid #F5A62333" }}>
                  <div style={{ fontSize: 10, color: "#8B949E" }}>FMC: основной риск</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#F5A623" }}>76,9% → 68,2% <span style={{ color: "#F85149", fontSize: 11 }}>−8,7 п.п.</span></div>
                  <div style={{ fontSize: 10, color: "#484F58" }}>Снижается — клиенты мигрируют или уходят</div>
                </div>
                <div style={{ flex: 2, background: "#0D1117", borderRadius: 8, padding: "8px 12px", border: "1px solid #3FB95033" }}>
                  <div style={{ fontSize: 10, color: "#8B949E" }}>FTTB+TV: bundle эффект</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#3FB950" }}>8,1% → 16,9% <span style={{ color: "#3FB950", fontSize: 11 }}>+8,8 п.п.</span></div>
                  <div style={{ fontSize: 10, color: "#484F58" }}>Upsell работает — bundle снижает churn</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ ФИНАНСОВЫЙ ЭФФЕКТ ══════════════════════════════════════════════════ */}
        {tab === "model" && (
          <div style={styles.grid2}>
            {/* Left: sliders */}
            <div style={styles.card}>
              <SectionHead title="Параметры модели" sub="Изменяйте значения — модель пересчитывается мгновенно" />
              <div style={{ background: "#0D1117", borderRadius: 8, padding: "12px 14px", marginBottom: 16, border: "1px solid #FF660033" }}>
                <div style={{ fontSize: 10, color: "#FF6600", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>База</div>
                <Slider label="ААБ домашнего интернета (абонентов)" value={aab} min={400000} max={900000} step={10000}
                  onChange={setAab} format={v => v.toLocaleString("ru-RU")} hint="Оценка ~20% рынка KZ фикс. ШПД" />
                <Slider label="ARPU (₸/мес.)" value={arpu} min={3000} max={8000} step={100}
                  onChange={setArpu} format={v => v.toLocaleString("ru-RU") + " ₸"} hint="Средний счёт Beeline дом. интернет" />
                <Slider label="COGS (₸/мес./абон.)" value={cogs} min={1000} max={3000} step={100}
                  onChange={setCogs} format={v => v.toLocaleString("ru-RU") + " ₸"} color="#8B949E" hint="~36% ARPU — отраслевой бенчмарк" />
              </div>
              <div style={{ background: "#0D1117", borderRadius: 8, padding: "12px 14px", marginBottom: 16, border: "1px solid #F8514933" }}>
                <div style={{ fontSize: 10, color: "#F85149", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Отток</div>
                <Slider label="Текущий churn (% в мес.)" value={currentChurn} min={0.5} max={3.5} step={0.1}
                  onChange={setCurrentChurn} format={v => v.toFixed(1) + "%"} color="#F85149" hint={`Реальный ср. 2025: ${avg2025}%`} />
                <Slider label="Целевой churn (% в мес.)" value={targetChurn} min={0.3} max={currentChurn - 0.1} step={0.1}
                  onChange={v => setTargetChurn(Math.min(v, currentChurn - 0.1))} format={v => v.toFixed(1) + "%"} color="#3FB950" hint="Цель программы удержания" />
                <Slider label="Управляемый отток (%)" value={addressable} min={50} max={90} step={1}
                  onChange={setAddressable} format={v => v + "%"} color="#58A6FF" hint="100% − переезд без тех.возм. (28%)" />
              </div>
              <div style={{ background: "#0D1117", borderRadius: 8, padding: "12px 14px", border: "1px solid #3FB95033" }}>
                <div style={{ fontSize: 10, color: "#3FB950", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Retention</div>
                <Slider label="Стоимость удержания (₸/абон.)" value={retCost} min={500} max={4000} step={100}
                  onChange={setRetCost} format={v => v.toLocaleString("ru-RU") + " ₸"} color="#3FB950" hint="Таргетированный оффер + операц. затраты" />
                <Slider label="Конверсия retention (%)" value={retConv} min={20} max={85} step={1}
                  onChange={setRetConv} format={v => v + "%"} color="#3FB950" hint="Отраслевой бенчмарк: 55–65%" />
              </div>
            </div>

            {/* Right: results */}
            <div>
              <div style={{ ...styles.card, marginBottom: 16, border: "1px solid #F8514933" }}>
                <SectionHead title="Текущие потери" sub={`При churn ${currentChurn}% в месяц`} />
                <div style={styles.grid2}>
                  {[
                    { label: "Абонентов теряется/мес.", val: calc.lostPerMonth.toLocaleString("ru-RU"), color: "#F85149" },
                    { label: "Потеря выручки/мес.", val: fmtKZT(calc.lostPerMonth * arpu), color: "#F85149" },
                    { label: "Потеря маржи/мес.", val: fmtKZT(calc.lostPerMonth * calc.margin), color: "#E74C3C" },
                    { label: "Потеря маржи/год", val: fmtKZT(calc.lostPerMonth * calc.margin * 12), color: "#E74C3C" },
                  ].map((k, i) => (
                    <div key={i} style={{ background: "#0D1117", borderRadius: 8, padding: "10px 12px", border: "1px solid #F8514922" }}>
                      <div style={{ fontSize: 10, color: "#8B949E", marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: k.color, fontFamily: "monospace" }}>{k.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.card, marginBottom: 16, border: "1px solid #3FB95033" }}>
                <SectionHead title={`Эффект программы: churn ${currentChurn}% → ${targetChurn}%`} sub="Снижение на " />
                <div style={styles.grid2}>
                  {[
                    { label: "Сохраняется/мес.", val: calc.savedPerMonth.toLocaleString("ru-RU") + " абон.", color: "#3FB950" },
                    { label: "Доп. выручка/мес.", val: fmtKZT(calc.revenueGain), color: "#3FB950" },
                    { label: "Доп. маржа/мес.", val: fmtKZT(calc.marginGain), color: "#3FB950" },
                    { label: "Затраты retention/мес.", val: fmtKZT(calc.retCostTotal), color: "#F39C12" },
                  ].map((k, i) => (
                    <div key={i} style={{ background: "#0D1117", borderRadius: 8, padding: "10px 12px", border: `1px solid ${k.color}22` }}>
                      <div style={{ fontSize: 10, color: "#8B949E", marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: k.color, fontFamily: "monospace" }}>{k.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...styles.card, border: "1px solid #FF660044", background: "linear-gradient(135deg, #1A1000 0%, #161B22 100%)" }}>
                <SectionHead title="Ключевые KPI эффективности" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "ROI программы", val: calc.roi.toFixed(1) + "×", color: calc.roi >= 10 ? "#3FB950" : "#F39C12", sub: "Норма: >10×" },
                    { label: "Чистый эффект/мес.", val: fmtKZT(calc.netEffect), color: calc.netEffect > 0 ? "#3FB950" : "#F85149", sub: "маржа − затраты" },
                    { label: "Чистый эффект/год", val: fmtKZT(calc.netYear), color: calc.netYear > 0 ? "#3FB950" : "#F85149", sub: "×12 месяцев" },
                    { label: "Payback (мес.)", val: calc.payback.toFixed(1), color: "#58A6FF", sub: "затраты / маржа" },
                    { label: "LTV текущий", val: fmtKZT(calc.ltvCurrent), color: "#8B949E", sub: `при churn ${currentChurn}%` },
                    { label: "LTV целевой", val: fmtKZT(calc.ltvTarget), color: "#FF6600", sub: `при churn ${targetChurn}%` },
                  ].map((k, i) => (
                    <div key={i} style={{ background: "#0D1117", borderRadius: 8, padding: "10px 12px", border: `1px solid ${k.color}33` }}>
                      <div style={{ fontSize: 10, color: "#8B949E", marginBottom: 4 }}>{k.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: k.color, fontFamily: "monospace" }}>{k.val}</div>
                      <div style={{ fontSize: 9, color: "#484F58", marginTop: 2 }}>{k.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ СЕГМЕНТЫ ═══════════════════════════════════════════════════════════ */}
        {tab === "segments" && (
          <div>
            <div style={styles.card}>
              <SectionHead title="Отток в разрезе сегментов (2025)" sub="FTTB уходит в 3,5× выше своей доли в базе — системная аномалия" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={churnBySegment} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="m" tick={{ fill: "#8B949E", fontSize: 9 }} />
                  <YAxis tickFormatter={v => v + "%"} tick={{ fill: "#8B949E", fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip unit="%" />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fmc" name="FMC" fill="#F5A623" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fttb" name="FTTB" fill="#E74C3C" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fttbtv" name="FTTB+TV" fill="#95A5A6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...styles.grid3, marginTop: 14 }}>
              {[
                {
                  seg: "FMC", color: "#F5A623", baseShare: "~72%", churnShare: "~33%",
                  anomaly: "НИЖЕ пропорции", anomalyColor: "#3FB950",
                  insight: "FMC — большинство базы, но даёт меньше оттока пропорционально. Риск скрытый: объём большой.",
                  action: "Таргетированный оффер при первых сигналах цены/качества. Upsell в FTTB+TV.",
                },
                {
                  seg: "FTTB", color: "#E74C3C", baseShare: "~15%", churnShare: "~53%",
                  anomaly: "В 3,5× выше нормы", anomalyColor: "#F85149",
                  insight: "FTTB — главная «дырявая» группа. 15% базы, но 53% оттока. Скорее всего: конкуренция GPON от Казахтелекома.",
                  action: "Срочный retention: апгрейд до FTTB+TV или loyalty оффер. Приоритет P1.",
                },
                {
                  seg: "FTTB+TV", color: "#95A5A6", baseShare: "~17%", churnShare: "~12%",
                  anomaly: "НИЖЕ пропорции", anomalyColor: "#3FB950",
                  insight: "Bundle работает: доля в оттоке ниже доли в базе. Рост с 8% до 17% базы подтверждает эффект.",
                  action: "Масштабировать upsell в bundle. Это страховка от конкурентов — 2+ продукта = 2,4× ниже churn.",
                },
              ].map((s, i) => (
                <div key={i} style={{ ...styles.card, borderTop: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginBottom: 10, fontFamily: "monospace" }}>{s.seg}</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, background: "#0D1117", borderRadius: 6, padding: "7px 10px" }}>
                      <div style={{ fontSize: 9, color: "#8B949E" }}>Доля в базе</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.baseShare}</div>
                    </div>
                    <div style={{ flex: 1, background: "#0D1117", borderRadius: 6, padding: "7px 10px" }}>
                      <div style={{ fontSize: 9, color: "#8B949E" }}>Доля в оттоке</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.churnShare}</div>
                    </div>
                  </div>
                  <div style={{ background: s.anomalyColor + "18", border: `1px solid ${s.anomalyColor}44`, borderRadius: 6, padding: "6px 10px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.anomalyColor }}>⚡ {s.anomaly}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#8B949E", marginBottom: 10, lineHeight: 1.5 }}>{s.insight}</div>
                  <div style={{ fontSize: 11, color: "#E6EDF3", background: "#0D1117", borderRadius: 6, padding: "8px 10px", lineHeight: 1.5 }}>
                    <span style={{ color: "#FF6600", fontWeight: 700 }}>→ </span>{s.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ СЦЕНАРИИ ═══════════════════════════════════════════════════════════ */}
        {tab === "scenarios" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {Object.entries(scenarios).map(([key, sc]) => {
                const r = scenarioCalc(sc);
                const isActive = scenario === key;
                return (
                  <div key={key}
                    onClick={() => setScenario(key)}
                    style={{
                      ...styles.card, cursor: "pointer",
                      border: isActive ? `2px solid ${sc.color}` : "1px solid #21262D",
                      background: isActive ? `linear-gradient(135deg, ${sc.color}11, #161B22)` : "#161B22",
                      transition: "all .2s",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sc.color }}>{sc.label}</div>
                      {isActive && <div style={{ fontSize: 10, color: sc.color, background: sc.color + "22", borderRadius: 4, padding: "2px 8px" }}>ВЫБРАН</div>}
                    </div>
                    {[
                      ["Текущий churn", sc.churn + "%"],
                      ["Целевой churn", sc.target + "%"],
                      ["Retention cost/абон.", sc.retCost.toLocaleString("ru-RU") + " ₸"],
                      ["Конверсия", sc.conv + "%"],
                    ].map(([l, v], i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, borderBottom: "1px solid #21262D", paddingBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#8B949E" }}>{l}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#E6EDF3", fontFamily: "monospace" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 10 }}>
                      {[
                        ["Чистый эффект/мес.", fmtKZT(r.netMonth), r.netMonth > 0 ? "#3FB950" : "#F85149"],
                        ["Чистый эффект/год", fmtKZT(r.netYear), r.netYear > 0 ? "#3FB950" : "#F85149"],
                        ["ROI", r.roi.toFixed(1) + "×", sc.color],
                      ].map(([l, v, c], i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#8B949E" }}>{l}</span>
                          <span style={{ fontSize: 13, fontWeight: 900, color: c, fontFamily: "monospace" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison chart */}
            <div style={styles.card}>
              <SectionHead title="Сравнение сценариев: чистый годовой эффект" sub={`ААБ: ${aab.toLocaleString("ru-RU")} | ARPU: ${arpu.toLocaleString("ru-RU")} ₸`} />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={Object.entries(scenarios).map(([k, sc]) => {
                    const r = scenarioCalc(sc);
                    return { name: sc.label, "Чистый эффект/год (млн ₸)": Math.round(r.netYear / 1e6 * 10) / 10, fill: sc.color };
                  })}
                  margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="name" tick={{ fill: "#8B949E", fontSize: 11 }} />
                  <YAxis tickFormatter={v => v + " млн"} tick={{ fill: "#8B949E", fontSize: 10 }} />
                  <Tooltip formatter={(v) => [v + " млн ₸"]} contentStyle={{ background: "#0D1117", border: "1px solid #30363D", borderRadius: 8 }} />
                  <Bar dataKey="Чистый эффект/год (млн ₸)" radius={[6, 6, 0, 0]}>
                    {Object.values(scenarios).map((sc, i) => (
                      <Cell key={i} fill={sc.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ══ ПРОГНОЗ ААБ ════════════════════════════════════════════════════════ */}
        {tab === "forecast" && (
          <div>
            <div style={styles.card}>
              <SectionHead
                title={`Прогноз ААБ на 6 месяцев — churn ${currentChurn}% → ${targetChurn}%`}
                sub="Зелёная зона — эффект программы удержания. Красная линия — потери без программы."
              />
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={calc.forecast} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />
                  <XAxis dataKey="m" tick={{ fill: "#8B949E", fontSize: 11 }} />
                  <YAxis tickFormatter={v => (v / 1000).toFixed(0) + "k"} tick={{ fill: "#8B949E", fontSize: 10 }} domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(v, n) => [v.toLocaleString("ru-RU") + " абон.", n]}
                    contentStyle={{ background: "#0D1117", border: "1px solid #30363D", borderRadius: 8, fontSize: 11 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="с_программой" name="С программой" fill="#3FB95022" stroke="#3FB950" strokeWidth={3} />
                  <Line type="monotone" dataKey="без_программы" name="Без программы" stroke="#F85149" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...styles.card, marginTop: 14 }}>
              <SectionHead title="Детальная таблица прогноза" />
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr>
                      {["Период", "ААБ без программы", "ААБ с программой", "Дополнительно абонентов", "Выручка без (млн ₸)", "Выручка с (млн ₸)", "Прирост выручки"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", background: "#0D1117", color: "#8B949E", fontWeight: 600, borderBottom: "1px solid #21262D", textAlign: "right", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calc.forecast.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#161B22" : "#0D1117" }}>
                        <td style={{ padding: "7px 10px", color: "#FF6600", fontWeight: 700 }}>{row.m}</td>
                        <td style={{ padding: "7px 10px", color: "#F85149", textAlign: "right", fontFamily: "monospace" }}>{row.без_программы.toLocaleString("ru-RU")}</td>
                        <td style={{ padding: "7px 10px", color: "#3FB950", textAlign: "right", fontFamily: "monospace" }}>{row.с_программой.toLocaleString("ru-RU")}</td>
                        <td style={{ padding: "7px 10px", color: row.разница > 0 ? "#3FB950" : "#8B949E", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                          {row.разница > 0 ? "+" : ""}{row.разница.toLocaleString("ru-RU")}
                        </td>
                        <td style={{ padding: "7px 10px", color: "#8B949E", textAlign: "right", fontFamily: "monospace" }}>{row.выручка_без}</td>
                        <td style={{ padding: "7px 10px", color: "#3FB950", textAlign: "right", fontFamily: "monospace" }}>{row.выручка_с}</td>
                        <td style={{ padding: "7px 10px", color: "#FF6600", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                          {i === 0 ? "—" : "+" + (row.выручка_с - row.выручка_без).toFixed(1) + " млн ₸"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                {[
                  { label: "Разница ААБ через 6 мес.", val: "+" + (calc.forecast[6]?.разница || 0).toLocaleString("ru-RU") + " абон.", color: "#3FB950" },
                  { label: "Доп. выручка 6-й мес.", val: "+" + ((calc.forecast[6]?.выручка_с || 0) - (calc.forecast[6]?.выручка_без || 0)).toFixed(1) + " млн ₸/мес.", color: "#FF6600" },
                  { label: "LTV разрыв/абонент", val: fmtKZT(calc.ltvTarget - calc.ltvCurrent), color: "#58A6FF" },
                ].map((k, i) => (
                  <div key={i} style={{ flex: 1, background: "#0D1117", borderRadius: 8, padding: "10px 14px", border: `1px solid ${k.color}33` }}>
                    <div style={{ fontSize: 10, color: "#8B949E", marginBottom: 4 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontFamily: "monospace" }}>{k.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
