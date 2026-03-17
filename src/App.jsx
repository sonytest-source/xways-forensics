import { useState } from "react";
import XWaysGuide    from "./xways_guide";
import XWaysScenario from "./xways_scenario";
import APTScenario   from "./apt_scenario";
import artifactguide   from "./artifact_guide";


const TABS = [
  { id: "artifact",    label: "📚 아티팩트",       component: artifactguide    },
  { id: "guide",    label: "📚 학습 가이드",       component: XWaysGuide    },
  { id: "scenario", label: "🔴 침해사고 시나리오", component: XWaysScenario },
  { id: "apt",      label: "🎯 APT 시나리오",      component: APTScenario   },
];

export default function App() {
  const [tab, setTab] = useState("guide");
  const Active = TABS.find(t => t.id === tab).component;

  return (
    <div style={{ minHeight: "100vh", background: "#010409", fontFamily: "sans-serif" }}>
      {/* 상단 탭 네비게이션 */}
      <nav style={{
        background: "#0d1117", borderBottom: "1px solid #21262d",
        padding: "10px 20px", display: "flex", gap: 8,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 8, border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
            background: tab === t.id ? "#238636" : "#21262d",
            color: tab === t.id ? "#fff" : "#8b949e",
          }}>{t.label}</button>
        ))}
      </nav>

      {/* 선택된 컴포넌트 렌더링 */}
      <Active />
    </div>
  );
}