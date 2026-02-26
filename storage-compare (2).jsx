import { useState } from "react";

// =============================================================================
// DATA LAYER
// storageData is the central source of truth for all three storage systems.
// Each system entry contains:
//   - color / accent: brand colors used throughout the UI for theming
//   - logo: single-letter abbreviation rendered in the system badge
//   - tagline: short vendor positioning statement shown under the system name
//   - Four category objects (performance, scalability, cost, cloud), each with:
//       - score (0–100): used for ScoreBar fills, RadarChart plotting, and
//         determining the "Top" winner badge in Detail view
//       - metric fields: the raw spec values rendered in the Detail field rows
//       - notes: a longer narrative blurb shown in the "Details" field row
// To add a new storage system, add a new top-level key here following the same
// shape — the rest of the UI will pick it up automatically.
// =============================================================================
const storageData = {
  "NetApp ONTAP": {
    color: "#00A1E0",
    accent: "#0078A8",
    logo: "N",
    tagline: "Unified Hybrid Cloud Storage",
    performance: {
      score: 88,
      latency: "< 300µs (NVMe)",
      iops: "Up to 11M IOPS",
      throughput: "300+ GB/s",
      protocol: "NFS, SMB, iSCSI, FC, NVMe-oF",
      notes: "ONTAP Select for software-defined; AFF A-Series for all-flash. Strong mixed workload performance with QoS policies.",
    },
    scalability: {
      score: 92,
      minCapacity: "2.4 TB",
      maxCapacity: "20+ PB (cluster)",
      maxNodes: "24 nodes per cluster",
      architecture: "Scale-up + Scale-out",
      notes: "FlexGroup volumes scale to 20 PB. Snapshots and clones with near-zero overhead. Multi-tenant via SVMs.",
    },
    cost: {
      score: 62,
      model: "CapEx + Subscription (Keystone)",
      entryCost: "$$$$",
      opex: "Keystone STaaS available",
      licensing: "Complex tiered licensing",
      notes: "Higher TCO than Pure but extensive feature set. FlexPod validated with Cisco UCS. Keystone FlexOS offers OPEX model.",
    },
    cloud: {
      score: 94,
      providers: ["AWS", "Azure", "GCP"],
      services: "Cloud Volumes ONTAP, FSx for ONTAP, ANF",
      dataFabric: "BlueXP unified control plane",
      notes: "Best-in-class hybrid cloud. SnapMirror replicates to any cloud. CVO runs natively in all 3 hyperscalers. Cloud Tiering to S3/Blob.",
    },
  },
  "Dell EMC PowerStore": {
    color: "#007DB8",
    accent: "#005A8C",
    logo: "D",
    tagline: "Intelligent, Adaptable Storage",
    performance: {
      score: 85,
      latency: "< 500µs (NVMe)",
      iops: "Up to 7M IOPS",
      throughput: "100+ GB/s",
      protocol: "iSCSI, FC, NFS, SMB, NVMe-oF",
      notes: "AppsON allows running containerized apps directly on the array. Inline deduplication and compression. Dynamic resource sharing across workloads.",
    },
    scalability: {
      score: 87,
      minCapacity: "1.2 TB",
      maxCapacity: "4 PB per appliance",
      maxNodes: "Metro clusters supported",
      architecture: "Scale-up with MetroSync",
      notes: "Modular design with PowerStore T (performance) and PowerStore X (AppsON). Non-disruptive expansion. Active-Active Metro clustering.",
    },
    cost: {
      score: 74,
      model: "CapEx / APEX Subscription",
      entryCost: "$$$",
      opex: "APEX Flex on Demand",
      licensing: "Simplified PowerStore Manager",
      notes: "APEX storage services offer pay-per-use. Strong Dell ecosystem discounts. Bundled data services (Replication, CloudIQ) reduce add-on cost.",
    },
    cloud: {
      score: 78,
      providers: ["AWS", "Azure"],
      services: "PowerStore CloudIQ, APEX Multi-Cloud",
      dataFabric: "CloudIQ AIOps",
      notes: "CloudIQ provides predictive analytics and cloud-connected insights. APEX extends to public cloud. Less native cloud-first than NetApp or Pure.",
    },
  },
  "Pure Storage FlashArray": {
    color: "#FF6D00",
    accent: "#CC5500",
    logo: "P",
    tagline: "Modern All-Flash, Always Simple",
    performance: {
      score: 95,
      latency: "< 100µs (guaranteed)",
      iops: "Up to 15M IOPS",
      throughput: "150+ GB/s",
      protocol: "iSCSI, FC, NVMe-oF, NFS (FlashBlade)",
      notes: "Industry-leading sub-100µs latency SLA. Evergreen//One guarantees performance. DirectFlash modules bypass controller bottlenecks.",
    },
    scalability: {
      score: 83,
      minCapacity: "17 TB",
      maxCapacity: "5+ PB per array",
      maxNodes: "ActiveCluster stretch",
      architecture: "Scale-up + ActiveCluster",
      notes: "Non-disruptive controller upgrades via Evergreen. ActiveCluster provides active-active HA across sites. FlashBlade//S for unstructured data at scale.",
    },
    cost: {
      score: 70,
      model: "CapEx / Evergreen//One STaaS",
      entryCost: "$$$",
      opex: "Evergreen//One consumption",
      licensing: "All-inclusive Purity software",
      notes: "Premium price but no forklift upgrades ever — Evergreen model replaces controllers/shelves. Evergreen//One STaaS includes guaranteed performance SLA.",
    },
    cloud: {
      score: 85,
      providers: ["AWS", "Azure", "GCP"],
      services: "Cloud Block Store, Pure Cloud Data Services",
      dataFabric: "Pure1 AI-driven management",
      notes: "Cloud Block Store runs FlashArray in cloud for DR/burst. Pure1 Meta uses ML for predictive support. Portworx provides cloud-native storage for Kubernetes.",
    },
  },
};

// =============================================================================
// NAVIGATION CONFIG
// `categories` drives the tab bar at the top of the content area. Each entry
// maps to a key in each system's storageData object, so adding a new category
// here requires a matching key in every storageData system entry.
// `systems` is derived directly from storageData so it stays in sync
// automatically when systems are added or removed.
// =============================================================================
const categories = [
  { id: "performance", label: "Performance & Latency", icon: "⚡" },
  { id: "scalability", label: "Scalability & Capacity", icon: "📈" },
  { id: "cost", label: "Cost & Licensing", icon: "💰" },
  { id: "cloud", label: "Cloud Integration", icon: "☁️" },
];

const systems = Object.keys(storageData);

// =============================================================================
// COMPONENT: ScoreBar
// A horizontal progress-bar that fills to `score`% using the system's brand
// `color`. Used inside the Score Overview cards in Detail view to give a quick
// visual sense of each system's relative strength in the active category.
// Props:
//   score  — integer 0–100, controls fill width
//   color  — CSS color string, applied to both the fill gradient and the label
// =============================================================================
function ScoreBar({ score, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          flex: 1,
          height: "6px",
          background: "rgba(255,255,255,0.08)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            borderRadius: "3px",
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      <span style={{ fontSize: "12px", color: color, fontWeight: 700, minWidth: "30px" }}>
        {score}
      </span>
    </div>
  );
}

// =============================================================================
// COMPONENT: RadarChart
// An SVG spider/radar chart that plots all four category scores for each
// selected system simultaneously. Useful for at-a-glance cross-system
// comparison across all dimensions at once (vs. the tab-based Detail view
// which focuses on one category at a time).
//
// Implementation notes:
//   - `polarToCart` converts a (angle, radius) polar coordinate to (x, y)
//     Cartesian coordinates, with 0° rotated to the top (–90° offset).
//   - Grid polygons are drawn at evenly-spaced radius intervals (5 levels).
//   - Each system's scores are mapped to points along the appropriate axis,
//     then connected into a filled polygon with the system's brand color.
//   - Axis labels are placed just beyond the outer grid ring.
// Props:
//   systems — string[] of system names to render (subset of storageData keys)
// =============================================================================
function RadarChart({ systems: selectedSystems }) {
  const catKeys = ["performance", "scalability", "cost", "cloud"];
  const catLabels = ["Perf", "Scale", "Cost", "Cloud"];
  const cx = 140, cy = 140, r = 100;
  const levels = 5;

  function polarToCart(angle, radius) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  const n = catKeys.length;
  const angles = catKeys.map((_, i) => (360 / n) * i);

  function getPath(systemName) {
    const data = storageData[systemName];
    const points = catKeys.map((k, i) => {
      const score = data[k].score;
      const pt = polarToCart(angles[i], (score / 100) * r);
      return `${pt.x},${pt.y}`;
    });
    return "M " + points.join(" L ") + " Z";
  }

  return (
    <svg width="280" height="280" style={{ display: "block", margin: "0 auto" }}>
      {/* Grid */}
      {Array.from({ length: levels }).map((_, li) => {
        const rr = (r * (li + 1)) / levels;
        const pts = angles.map((a) => {
          const p = polarToCart(a, rr);
          return `${p.x},${p.y}`;
        });
        return (
          <polygon
            key={li}
            points={pts.join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
          />
        );
      })}
      {/* Axes */}
      {angles.map((a, i) => {
        const p = polarToCart(a, r);
        const lp = polarToCart(a, r + 22);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <text
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.85)"
              fontSize="11"
              fontFamily="'IBM Plex Mono', monospace"
            >
              {catLabels[i]}
            </text>
          </g>
        );
      })}
      {/* Data areas */}
      {selectedSystems.map((sys) => (
        <path
          key={sys}
          d={getPath(sys)}
          fill={storageData[sys].color + "22"}
          stroke={storageData[sys].color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
      {/* Dots */}
      {selectedSystems.map((sys) =>
        catKeys.map((k, i) => {
          const score = storageData[sys][k].score;
          const pt = polarToCart(angles[i], (score / 100) * r);
          return (
            <circle
              key={sys + k}
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill={storageData[sys].color}
            />
          );
        })
      )}
    </svg>
  );
}

// =============================================================================
// COMPONENT: App (Root)
// The top-level component. Owns all UI state and composes the full page layout.
//
// State:
//   activeCategory   — which category tab is currently selected ("performance",
//                      "scalability", "cost", or "cloud")
//   selectedSystems  — array of system names currently toggled on; at least one
//                      system is always kept active (toggle logic enforces this)
//   view             — "detail" shows the tab+cards+field-rows layout; "radar"
//                      shows the SVG spider chart with average score cards
//
// Layout structure:
//   1. Header       — app title, view toggle (Detail / Radar), system toggles
//   2. Category Tabs — tab bar mapping to the four comparison dimensions
//   3. Content Area — conditionally renders Radar view or Detail view:
//        Radar view:   RadarChart + per-system average score summary cards
//        Detail view:  Score Overview row → Detail Field rows → Quick Verdict
//   4. Footer        — disclaimer text
// =============================================================================
export default function App() {
  const [activeCategory, setActiveCategory] = useState("performance");
  const [selectedSystems, setSelectedSystems] = useState(systems);
  const [view, setView] = useState("detail"); // "detail" | "radar"

  // Toggles a system on/off. Blocks removal if only one system is active,
  // so the UI always has at least one system displayed.
  const toggleSystem = (sys) => {
    setSelectedSystems((prev) =>
      prev.includes(sys)
        ? prev.length > 1 ? prev.filter((s) => s !== sys) : prev
        : [...prev, sys]
    );
  };

  // Resolves the full category object for the active tab — used to display
  // the active category's icon and label elsewhere in the UI.
  const activeCat = categories.find((c) => c.id === activeCategory);

  // -------------------------------------------------------------------------
  // FIELD LABELS MAP
  // Controls which fields are shown in Detail view for each category and in
  // what order. Keys must match field names in each storageData category object.
  // -------------------------------------------------------------------------
  const fieldLabels = {
    performance: [
      { key: "latency", label: "Latency" },
      { key: "iops", label: "Max IOPS" },
      { key: "throughput", label: "Throughput" },
      { key: "protocol", label: "Protocols" },
      { key: "notes", label: "Details" },
    ],
    scalability: [
      { key: "minCapacity", label: "Min Capacity" },
      { key: "maxCapacity", label: "Max Capacity" },
      { key: "maxNodes", label: "Clustering" },
      { key: "architecture", label: "Architecture" },
      { key: "notes", label: "Details" },
    ],
    cost: [
      { key: "model", label: "Model" },
      { key: "entryCost", label: "Entry Cost" },
      { key: "opex", label: "OpEx Option" },
      { key: "licensing", label: "Licensing" },
      { key: "notes", label: "Details" },
    ],
    cloud: [
      { key: "providers", label: "Providers" },
      { key: "services", label: "Cloud Services" },
      { key: "dataFabric", label: "Management" },
      { key: "notes", label: "Details" },
    ],
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0C10",
        color: "#E8EAF0",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        padding: "0",
      }}
    >
      {/*
        GLOBAL STYLES
        Injected as a <style> tag so we can use class-based selectors alongside
        inline styles. Covers:
          - Google Fonts import (IBM Plex Mono for body/mono text, Syne for headings)
          - CSS reset (box-sizing, margin, padding)
          - Reusable utility classes: .sys-toggle (system filter buttons),
            .cat-btn (category tab buttons), .view-btn (Detail/Radar toggle),
            .card (dark bordered panel used throughout), .field-row (two-column
            label+value layout inside cards), .winner-badge (colored "Top" chip)
      */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sys-toggle {
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 8px 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          transition: all 0.2s;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.82);
        }
        .sys-toggle.active {
          background: rgba(255,255,255,0.06);
          color: #E8EAF0;
        }
        .sys-toggle:hover { border-color: rgba(255,255,255,0.25); }

        .cat-btn {
          cursor: pointer;
          padding: 10px 18px;
          border: none;
          background: transparent;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .cat-btn.active {
          color: #E8EAF0;
          border-bottom-color: #E8EAF0;
        }
        .cat-btn:hover { color: rgba(255,255,255,0.7); }

        .view-btn {
          cursor: pointer;
          padding: 6px 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.8);
          transition: all 0.2s;
        }
        .view-btn:first-child { border-radius: 4px 0 0 4px; }
        .view-btn:last-child { border-radius: 0 4px 4px 0; border-left: none; }
        .view-btn.active {
          background: rgba(255,255,255,0.08);
          color: #E8EAF0;
        }

        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .card:hover { border-color: rgba(255,255,255,0.13); }

        .field-row {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          align-items: start;
        }
        .field-row:last-child { border-bottom: none; }

        .winner-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-left: 6px;
          vertical-align: middle;
        }
      `}</style>

      {/*
        SECTION: HEADER
        Contains the app title/subtitle on the left, and two control groups on
        the right: the Detail/Radar view toggle (two buttons acting as a
        segmented control), and the system toggle buttons (one per storage
        system). System toggles are color-coded with the system's brand color
        when active, and enforce a minimum of one active system.
      */}
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 32px 24px",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", marginBottom: "6px" }}>
                Enterprise Storage Intelligence
              </div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "clamp(24px, 4vw, 38px)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.55) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Storage System
                <br />
                Comparator
              </h1>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ display: "flex" }}>
                <button className={`view-btn ${view === "detail" ? "active" : ""}`} onClick={() => setView("detail")}>
                  Detail
                </button>
                <button className={`view-btn ${view === "radar" ? "active" : ""}`} onClick={() => setView("radar")}>
                  Radar
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                {systems.map((sys) => (
                  <button
                    key={sys}
                    className={`sys-toggle ${selectedSystems.includes(sys) ? "active" : ""}`}
                    style={
                      selectedSystems.includes(sys)
                        ? { borderColor: storageData[sys].color + "80", color: storageData[sys].color }
                        : {}
                    }
                    onClick={() => toggleSystem(sys)}
                  >
                    <span style={{ display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: selectedSystems.includes(sys) ? storageData[sys].color : "transparent", border: `1px solid ${storageData[sys].color}`, marginRight: "7px", verticalAlign: "middle" }} />
                    {sys}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*
        SECTION: CATEGORY TABS
        Horizontal tab bar that sets `activeCategory` state, controlling which
        dimension's data is shown in the Detail view below. Tabs are scrollable
        on narrow viewports via overflowX: auto. Hidden in Radar view since
        the chart plots all four categories simultaneously.
      */}
      {/* Category Tabs */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", display: "flex", gap: "0", overflowX: "auto" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/*
        SECTION: CONTENT AREA
        Max-width constrained wrapper that conditionally renders either the
        Radar view or the Detail view depending on the `view` state variable.
      */}
      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px" }}>

        {/*
          RADAR VIEW
          Shown when view === "radar". Renders the RadarChart SVG centered on
          the page, followed by a color-keyed legend, then a row of summary
          cards showing each system's average score across all four categories.
          Average is computed as a simple mean of the four category scores.
        */}
        {view === "radar" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", padding: "20px 0" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              All-Category Radar — {selectedSystems.join(" vs ")}
            </div>
            <RadarChart systems={selectedSystems} />
            <div style={{ display: "flex", gap: "24px" }}>
              {selectedSystems.map((sys) => (
                <div key={sys} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "24px", height: "3px", background: storageData[sys].color, borderRadius: "2px" }} />
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.9)" }}>{sys}</span>
                </div>
              ))}
            </div>
            {/*
              RADAR VIEW — AVERAGE SCORE SUMMARY CARDS
              One card per selected system showing its logo, abbreviated name,
              and the computed mean score across all four categories (0–100).
            */}
            {/* Score summary */}
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${selectedSystems.length}, 1fr)`, gap: "16px", width: "100%", maxWidth: "700px", marginTop: "8px" }}>
              {selectedSystems.map((sys) => {
                const data = storageData[sys];
                const avg = Math.round(["performance","scalability","cost","cloud"].reduce((a,k) => a + data[k].score, 0) / 4);
                return (
                  <div key={sys} className="card" style={{ padding: "20px", textAlign: "center" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: data.color + "22", border: `1px solid ${data.color}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: "16px", fontWeight: 800, color: data.color, fontFamily: "'Syne', sans-serif" }}>
                      {data.logo}
                    </div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>{sys.replace(" Storage","").replace(" EMC","")}</div>
                    <div style={{ fontSize: "28px", fontWeight: 800, fontFamily: "'Syne', sans-serif", color: data.color }}>{avg}</div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Avg Score</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/*
              DETAIL VIEW (default view)
              Three stacked sub-sections rendered for the currently active category:
                1. Score Overview Row — per-system score cards with ScoreBars
                2. Field Rows        — side-by-side metric comparison table
                3. Quick Verdict     — plain-language summary per system
            */}
            {/*
              DETAIL VIEW — SCORE OVERVIEW ROW
              One card per selected system showing the system's logo badge,
              name, tagline, and a ScoreBar for the active category. The card
              with the highest score gets a colored border and a "Top" badge.
              Grid columns adjust dynamically based on the number of active systems.
            */}
            {/* Score Overview Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${selectedSystems.length}, 1fr)`,
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {selectedSystems.map((sys) => {
                const data = storageData[sys];
                const catData = data[activeCategory];
                const isTop = selectedSystems.reduce((best, s) => storageData[s][activeCategory].score > storageData[best][activeCategory].score ? s : best, selectedSystems[0]) === sys;
                return (
                  <div
                    key={sys}
                    className="card"
                    style={{
                      padding: "20px",
                      borderColor: isTop ? data.color + "44" : undefined,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                      <div
                        style={{
                          width: "36px", height: "36px", borderRadius: "8px",
                          background: data.color + "1A",
                          border: `1px solid ${data.color}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "16px", fontWeight: 800, color: data.color,
                          fontFamily: "'Syne', sans-serif", flexShrink: 0,
                        }}
                      >
                        {data.logo}
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#E8EAF0", lineHeight: 1.2 }}>{sys}</div>
                        <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", marginTop: "1px" }}>{data.tagline}</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {activeCat.label}
                        </span>
                        {isTop && (
                          <span className="winner-badge" style={{ background: data.color + "22", color: data.color, border: `1px solid ${data.color}44` }}>
                            Top
                          </span>
                        )}
                      </div>
                      <ScoreBar score={catData.score} color={data.color} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/*
              DETAIL VIEW — FIELD ROWS
              Each row corresponds to one entry in `fieldLabels[activeCategory]`.
              A row shows a labelled header spanning the full width, then splits
              into N columns (one per selected system) for the actual values.
              The "entryCost" field gets special dollar-sign styling; "notes"
              is rendered at reduced opacity as supplementary context.
            */}
            {/* Detail Fields */}
            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              {fieldLabels[activeCategory].map(({ key, label }) => (
                <div
                  key={key}
                  className="card"
                  style={{ padding: "0" }}
                >
                  <div
                    style={{
                      padding: "10px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${selectedSystems.length}, 1fr)`,
                    }}
                  >
                    {selectedSystems.map((sys, idx) => {
                      const val = storageData[sys][activeCategory][key];
                      const displayVal = Array.isArray(val) ? val.join(", ") : val;
                      const isLast = idx === selectedSystems.length - 1;
                      return (
                        <div
                          key={sys}
                          style={{
                            padding: "14px 20px",
                            borderRight: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                            fontSize: key === "notes" ? "11px" : "12px",
                            color: key === "notes" ? "rgba(255,255,255,0.5)" : "#E8EAF0",
                            lineHeight: 1.5,
                          }}
                        >
                          {key === "entryCost" ? (
                            <span style={{ color: storageData[sys].color, fontSize: "16px", letterSpacing: "2px" }}>{displayVal}</span>
                          ) : (
                            displayVal
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/*
              DETAIL VIEW — QUICK VERDICT
              A plain-language one-liner for each system scoped to the active
              category. Rendered as a color-accented column per system, each
              with a thin left border in the system's brand color for visual
              separation. Verdicts are static strings keyed by [category][system].
            */}
            {/* Bottom summary */}
            <div style={{ marginTop: "24px", padding: "16px 20px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.65)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>Quick Verdict</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${selectedSystems.length}, 1fr)`, gap: "16px" }}>
                {selectedSystems.map((sys) => {
                  const verdicts = {
                    performance: { "NetApp ONTAP": "Best for mixed workloads with QoS control", "Dell EMC PowerStore": "Strong with AppsON for converged compute+storage", "Pure Storage FlashArray": "Fastest with guaranteed sub-100µs SLA" },
                    scalability: { "NetApp ONTAP": "Most scalable for NAS & SAN at petabyte scale", "Dell EMC PowerStore": "Solid for mid-range with Metro clustering", "Pure Storage FlashArray": "Best non-disruptive upgrade path (Evergreen)" },
                    cost: { "NetApp ONTAP": "Highest TCO but broadest feature set & STaaS option", "Dell EMC PowerStore": "Best value in the Dell ecosystem with APEX", "Pure Storage FlashArray": "Premium price, zero upgrade costs over time" },
                    cloud: { "NetApp ONTAP": "Best hybrid cloud with native presence in all 3 hyperscalers", "Dell EMC PowerStore": "Good cloud telemetry; less native cloud integration", "Pure Storage FlashArray": "Strong with Portworx for cloud-native/Kubernetes" },
                  };
                  return (
                    <div key={sys} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <div style={{ width: "3px", height: "100%", minHeight: "36px", background: storageData[sys].color, borderRadius: "2px", flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <div style={{ fontSize: "10px", color: storageData[sys].color, fontWeight: 700, marginBottom: "3px" }}>{sys}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>
                          {verdicts[activeCategory][sys]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/*
        SECTION: FOOTER
        A minimal disclaimer strip noting that data is sourced from published
        vendor specifications and is intended for reference only.
      */}
      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "16px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
          ENTERPRISE STORAGE COMPARATOR · DATA BASED ON PUBLISHED VENDOR SPECS · FOR REFERENCE ONLY
        </div>
      </div>
    </div>
  );
}
