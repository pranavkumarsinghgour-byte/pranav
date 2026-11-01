"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Factory, Wheat, Package, ClipboardList,
  ShoppingCart, ShieldCheck, Wrench, Users, Truck,
  Bot, Bell, Search, Settings, Menu, MessageSquare,
  TrendingUp, AlertTriangle, Boxes, Send, ChevronRight,
  FileBarChart, CircleHelp
} from "lucide-react";

const navigation = [
  { title: "Management", items: [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "AI Assistant", icon: Bot },
    { name: "Users Management", icon: Bot },
  ]},
  { title: "ERP Modules", items: [
    { name: "Production", icon: Factory },
    { name: "Raw Material Stores", icon: Wheat },
    { name: "Packing Material Stores", icon: Package },
    { name: "Inventory & GRN", icon: ClipboardList },
    { name: "Purchase", icon: ShoppingCart },
    { name: "Quality", icon: ShieldCheck },
    { name: "Maintenance", icon: Wrench },
    { name: "Manpower", icon: Users },
    { name: "Dispatch", icon: Truck },
    { name: "AI Reports", icon: FileBarChart },
  ]},
];

const metrics = [
  { title: "Today's Production", value: "72 MT", detail: "Target: 80 MT", icon: Factory, color: "blue" },
  { title: "RM Inventory", value: "245 MT", detail: "Raw material stock", icon: Wheat, color: "green" },
  { title: "PM Inventory", value: "18.5 L", detail: "Packing material units", icon: Package, color: "purple" },
  { title: "Pending GRNs", value: "08", detail: "Awaiting clearance", icon: ClipboardList, color: "orange" },
];

const alerts = [
  { title: "Critical PM stock", detail: "Check CFC and laminate availability", level: "Critical" },
  { title: "Pending GRN clearance", detail: "8 GRNs awaiting processing", level: "High" },
  { title: "Production achievement", detail: "Current achievement is 90% of target", level: "Normal" },
];

export default function Home() {
  const router = useRouter();
const supabase = createClient();

async function handleLogout() {
  await supabase.auth.signOut();
  router.replace("/login");
  router.refresh();
}
  const [active, setActive] = useState("Dashboard");
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function askAI() {
    if (!question.trim()) return;
    setChat([...chat, question.trim()]);
    setQuestion("");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">

      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} overflow-hidden shrink-0 bg-slate-950 text-white transition-all duration-300`}>
        <div className="h-20 px-5 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Bot size={25}/>
          </div>
          <div>
            <h1 className="font-bold text-lg">MY AI ASSISTANT</h1>
            <p className="text-xs text-slate-400">Manufacturing ERP</p>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
  if (item.name === "Users Management") {
    router.push("/users");
  } else {
    setActive(item.name);
  }
}}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                        active === item.name
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                      }`}
                      
                    >
                      <Icon size={18}/>
                      {item.name}
                      {item.name === "AI Assistant" && (
                        <span className="ml-auto text-xs">AI</span>
                      )}
                    </button>
                    
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-5 left-5 text-xs text-slate-500">
          My AI Assistant ERP · Version 1.0
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg">
              <Menu size={22}/>
            </button>
            <div>
              <h2 className="font-bold text-lg">{active}</h2>
              <p className="text-xs text-slate-500">Manufacturing ERP Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-slate-100">
              <Search size={19}/>
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 relative">
              <Bell size={19}/>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"/>
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold">Pranav Gour</p>
              <p className="text-xs text-slate-500">Administrator</p>
              <button
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
              Logout
              </button>

            </div>

            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
              PG
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 space-y-7">

          {/* WELCOME */}
          <section className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Management Overview</h1>
              <p className="text-slate-500 text-sm mt-1">
                Welcome back, Pranav. Here is your plant overview.
              </p>
            </div>
            <div className="bg-white border rounded-lg px-4 py-2 text-sm text-slate-600">
              <span className="font-medium">Plant:</span> All Locations
            </div>
          </section>

          {/* KPI CARDS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500">{m.title}</p>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Icon size={20}/>
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold mt-4">{m.value}</h2>
                  <p className="text-xs text-slate-500 mt-2">{m.detail}</p>
                </div>
              );
            })}
          </section>

          {/* PRODUCTION */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 bg-white rounded-xl border p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg">Production Performance</h3>
                  <p className="text-sm text-slate-500">Daily plant achievement</p>
                </div>
                <TrendingUp className="text-green-600"/>
              </div>

              <div className="flex justify-between items-end mb-3">
                <div>
                  <span className="text-4xl font-bold">90%</span>
                  <p className="text-xs text-slate-500 mt-1">Production achievement</p>
                </div>
                <span className="text-sm font-medium text-slate-600">72 / 80 MT</span>
              </div>

              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{width:"90%"}}/>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-7">
                {["Line 1","Line 2","Line 3"].map((line,i)=>(
                  <div key={line} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">{line}</p>
                    <p className="font-bold text-xl mt-1">{[28,24,20][i]} MT</p>
                    <p className="text-xs text-green-600 mt-1">Illustrative</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ALERTS */}
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="text-orange-500"/>
                <h3 className="font-bold">Critical Alerts</h3>
              </div>
              <div className="space-y-4">
                {alerts.map((a)=>(
                  <div key={a.title} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <span className={`text-xs ${a.level==="Critical"?"text-red-600":a.level==="High"?"text-orange-600":"text-green-600"}`}>
                        {a.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{a.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AI ASSISTANT */}
          <section className="bg-slate-950 rounded-xl p-5 md:p-7 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Bot size={25}/>
              </div>
              <div>
                <h3 className="font-bold text-lg">My AI Assistant</h3>
                <p className="text-xs text-slate-400">Your manufacturing intelligence assistant</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 mb-4 min-h-20">
              {chat.length === 0 ? (
                <p className="text-sm text-slate-300">
                  Hello Pranav! I am your ERP assistant. Ask me about production,
                  inventory, pending GRNs, quality or dispatch.
                </p>
              ) : (
                <div className="space-y-3">
                  {chat.map((q,i)=>(
                    <div key={i} className="bg-slate-700 rounded-lg p-3 text-sm">
                      {q}
                      <p className="text-xs text-blue-300 mt-2">
                        AI connection will be activated in the next development stage.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e)=>setQuestion(e.target.value)}
                onKeyDown={(e)=>e.key==="Enter"&&askAI()}
                placeholder="Ask about your plant operations..."
                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <button onClick={askAI}
                className="bg-blue-600 hover:bg-blue-700 px-4 rounded-lg">
                <Send size={19}/>
              </button>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="flex flex-wrap justify-between gap-2 text-xs text-slate-400">
            <p>My AI Assistant ERP | Manufacturing Management</p>
            <p>Administrator: Pranav Gour</p>
          </footer>

        </div>
      </main>
    </div>
  );
}
