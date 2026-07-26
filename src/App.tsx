import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppProvider, useApp } from "./context/AppContext";
import { CustomerView, VendorView, AdminView, CapstoneDocView } from "./components/AppViews";
import {
  ShoppingCart, Users, Store, FileText, Menu as MenuIcon, X,
  ChevronDown, User, LogOut, Bell, Sun, Moon, Package,
  Sparkle, Code, Terminal
} from "lucide-react";

/* ──────────────── Role Switcher & Navigation ──────────────── */

const NAV_ITEMS = [
  { role: "customer" as const, label: "Customer", icon: ShoppingCart, color: "bg-amber-500" },
  { role: "vendor" as const, label: "Vendor", icon: Store, color: "bg-emerald-500" },
  { role: "admin" as const, label: "Admin", icon: Users, color: "bg-blue-500" },
  { role: "docs" as const, label: "Documentation", icon: FileText, color: "bg-purple-500" },
];

function AppShell() {
  const { state, dispatch, cartCount } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const currentNav = NAV_ITEMS.find((n) => n.role === state.activeRole) || NAV_ITEMS[0];

  return (
    <div className={`min-h-screen bg-gray-50/80 ${darkMode ? "dark" : ""}`}>
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3M</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-gray-900 text-sm leading-tight">3MTT Capstone</h1>
                  <p className="text-[10px] text-gray-500 -mt-0.5">Food Ordering App</p>
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = state.activeRole === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => dispatch({ type: "SET_ROLE", payload: item.role })}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className={`absolute inset-0 rounded-xl ${item.color}`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Cart badge (customer only) */}
              {state.activeRole === "customer" && cartCount > 0 && (
                <button className="relative p-2 rounded-xl hover:bg-gray-100">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                </button>
              )}

              {/* Dark mode toggle */}
              <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100">
                {darkMode ? <Sun className="w-4 h-4 text-gray-600" /> : <Moon className="w-4 h-4 text-gray-600" />}
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-amber-700">
                      {state.currentUser.name.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{state.currentUser.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-gray-200 shadow-xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 mb-1">
                        <p className="text-sm font-semibold">{state.currentUser.name}</p>
                        <p className="text-xs text-gray-500">{state.currentUser.email}</p>
                      </div>
                      {state.users.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            dispatch({ type: "SET_USER", payload: u });
                            setUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                            u.id === state.currentUser.id
                              ? "bg-amber-50 text-amber-700 font-medium"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                            {u.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">{u.name}</p>
                            <p className="text-[10px] text-gray-500 capitalize">{u.role}</p>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-gray-200 shadow-lg"
          >
            <div className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = state.activeRole === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      dispatch({ type: "SET_ROLE", payload: item.role });
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? `${item.color} text-white` : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.activeRole}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {state.activeRole === "customer" && <CustomerView />}
            {state.activeRole === "vendor" && <VendorView />}
            {state.activeRole === "admin" && <AdminView />}
            {state.activeRole === "docs" && <CapstoneDocView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© 2025 3MTT Capstone Project — Idris Yusuf Sani</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Code className="w-3 h-3" /> React + TypeScript</span>
            <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> Tailwind CSS</span>
            <span className="flex items-center gap-1"><Sparkle className="w-3 h-3" /> Framer Motion</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────── Root App ──────────────── */

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;