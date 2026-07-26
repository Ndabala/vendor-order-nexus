import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { CAPSTONE_SECTIONS, DEFAULT_VENDORS, DEFAULT_FOOD_ITEMS, DEFAULT_CATEGORIES, DEFAULT_ORDERS, DEFAULT_USERS } from "../constants";
import type { FoodItem, CartItem, Order, Vendor } from "../types";
import {
  ShoppingCart, X, Plus, Minus, Search, Star, Clock, Truck, MapPin,
  ChevronRight, ChevronLeft, Check, Filter, ExternalLink, Package,
  TrendingUp, DollarSign, Edit, Trash, Bell, AlertCircle,
  MoreHorizontal, LogOut, Users, Store, RefreshCw, BookOpen,
  Presentation, Grid3x3, FileText, CircleAlert, Shield, ArrowRight,
  Home, Tag, EyeOff, Sliders,
  Upload, Phone, Mail, Info, Square, Activity,
  ChefHat, ClipboardList, CreditCard, MessageSquare, Calendar,
  List, Menu, Settings, User, Download, Target, GitCommitHorizontal,
  Code, FolderTree, Zap, CheckCircle, GitBranch, Rocket, Link
} from "lucide-react";

/* ──────────────── Reusable shared components ──────────────── */

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  accepted: "bg-blue-100 text-blue-800 border-blue-300",
  preparing: "bg-orange-100 text-orange-800 border-orange-300",
  delivering: "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  accepted: <Check className="w-3.5 h-3.5" />,
  preparing: <ChefHat className="w-3.5 h-3.5" />,
  delivering: <Truck className="w-3.5 h-3.5" />,
  completed: <Package className="w-3.5 h-3.5" />,
  cancelled: <X className="w-3.5 h-3.5" />,
};

const statusSteps = ["pending", "accepted", "preparing", "delivering", "completed"];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[status] || "bg-gray-100 text-gray-700"}`}>
      {statusIcons[status] || <AlertCircle className="w-3.5 h-3.5" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.01 }} className={`rounded-2xl p-5 border bg-white shadow-sm ${accent ? `border-l-4 ${accent}` : "border-gray-200"}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-gray-50 text-gray-600">{icon}</div>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-gray-50 text-gray-400 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs">{desc}</p>
    </div>
  );
}

/* ──────────────── Customer View ──────────────── */

function CustomerView() {
  const { state, dispatch, getVendor, getFoodItems, getOrdersForUser, cartTotal, cartCount } = useApp();
  const [search, setSearch] = useState("");
  const [activeVendor, setActiveVendor] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrder, setShowOrder] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState("No. 15 Ahmadu Bello Way, Kaduna");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const openVendors = state.vendors.filter((v) => v.isOpen && v.isApproved && !v.isSuspended);
  const featuredVendors = openVendors.filter((v) => v.rating >= 4.5);

  const filteredVendors = useMemo(() => {
    if (!search) return openVendors;
    const q = search.toLowerCase();
    return openVendors.filter((v) => v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
  }, [openVendors, search]);

  const currentVendor = activeVendor ? getVendor(activeVendor) : null;
  const vendorItems = activeVendor ? getFoodItems(activeVendor) : [];
  const filteredItems = useMemo(() => {
    let items = vendorItems.filter((f) => f.isAvailable);
    if (activeCategory) items = items.filter((f) => f.category === activeCategory);
    return items;
  }, [vendorItems, activeCategory]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    vendorItems.forEach((f) => cats.add(f.category));
    return Array.from(cats);
  }, [vendorItems]);

  const userOrders = getOrdersForUser(state.currentUser.id);

  const handleAddToCart = (item: FoodItem) => {
    dispatch({ type: "ADD_TO_CART", payload: { item, quantity: 1 } });
  };

  const handlePlaceOrder = () => {
    if (state.cart.length === 0) return;
    const vendor = currentVendor || getVendor(state.cart[0].item.vendorId);
    if (!vendor) return;
    const order: Order = {
      id: `ord-${Date.now()}`,
      userId: state.currentUser.id,
      vendorId: vendor.id,
      items: state.cart.map((c) => ({
        foodItemId: c.item.id,
        name: c.item.name,
        quantity: c.quantity,
        price: c.item.price,
      })),
      total: cartTotal,
      deliveryFee: vendor.deliveryFee,
      status: "pending",
      createdAt: new Date().toISOString(),
      deliveryAddress,
      paymentMethod,
      estimatedDelivery: new Date(Date.now() + 1800000).toISOString(),
    };
    dispatch({ type: "PLACE_ORDER", payload: order });
    setShowCheckout(false);
    setShowCart(false);
    setShowOrder(order.id);
  };

  /* ── Vendor grid ── */
  if (!activeVendor) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors or cuisines..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-sm"
          />
        </div>

        {/* Featured */}
        {!search && featuredVendors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Featured Vendors
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredVendors.map((v, i) => (
                <motion.button
                  key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  onClick={() => setActiveVendor(v.id)}
                  className="relative group text-left rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="h-28 overflow-hidden">
                    <img src={v.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <img src={v.image} alt={v.name} className="w-12 h-12 rounded-full border-2 border-white -mt-10 shadow-md object-cover" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{v.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{v.rating}</span>
                          <span>{v.prepTime}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{v.description}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" /> ₦{v.deliveryFee} delivery
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* All Vendors */}
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {search ? `Results for "${search}"` : "All Vendors"}
        </h2>
        {filteredVendors.length === 0 ? (
          <EmptyState icon={<Store className="w-12 h-12" />} title="No vendors found" desc="Try adjusting your search or check back later." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map((v, i) => (
              <motion.button
                key={v.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setActiveVendor(v.id)}
                className="relative group text-left rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all"
              >
                <div className="h-24 overflow-hidden">
                  <img src={v.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={v.image} alt={v.name} className="w-10 h-10 rounded-full border-2 border-white -mt-8 shadow-md object-cover" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{v.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{v.rating}</span>
                        <span>{v.prepTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-6 right-6 z-40 bg-amber-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold">{cartCount} items</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-bold">₦{cartTotal.toLocaleString()}</span>
          </motion.button>
        )}

        {/* Cart Drawer */}
        <AnimatePresence>
          {showCart && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowCart(false)}>
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Your Cart</h2>
                  <button onClick={() => setShowCart(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {state.cart.map((c) => (
                    <div key={c.item.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                      <img src={c.item.image} alt={c.item.name} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{c.item.name}</p>
                        <p className="text-xs text-gray-500">₦{c.item.price.toLocaleString()} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dispatch({ type: "UPDATE_CART_QTY", payload: { foodItemId: c.item.id, quantity: c.quantity - 1 } })}
                          className="p-1.5 rounded-lg bg-white border hover:bg-gray-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">{c.quantity}</span>
                        <button
                          onClick={() => dispatch({ type: "UPDATE_CART_QTY", payload: { foodItemId: c.item.id, quantity: c.quantity + 1 } })}
                          className="p-1.5 rounded-lg bg-white border hover:bg-gray-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button onClick={() => dispatch({ type: "REMOVE_FROM_CART", payload: c.item.id })} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {state.cart.length === 0 && (
                    <EmptyState icon={<ShoppingCart className="w-12 h-12" />} title="Cart is empty" desc="Add items from a vendor's menu to get started." />
                  )}
                </div>
                {state.cart.length > 0 && (
                  <div className="border-t p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-semibold">₦{cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Delivery Fee</span>
                      <span className="font-semibold">₦{(currentVendor?.deliveryFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-amber-600">₦{(cartTotal + (currentVendor?.deliveryFee || 0)).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => { setShowCart(false); setShowCheckout(true); }}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckout && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowCheckout(false)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Checkout</h2>
                  <button onClick={() => setShowCheckout(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Delivery Address</label>
                    <div className="flex items-center gap-2 p-3 rounded-xl border bg-gray-50">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="bg-transparent flex-1 text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "card" ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-white border-gray-200 text-gray-600"}`}
                      >
                        <CreditCard className="w-4 h-4 inline mr-1.5" /> Card Payment
                      </button>
                      <button
                        onClick={() => setPaymentMethod("cash")}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "cash" ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-white border-gray-200 text-gray-600"}`}
                      >
                        <DollarSign className="w-4 h-4 inline mr-1.5" /> Cash on Delivery
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Special Instructions</label>
                    <textarea
                      value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="Any special requests?"
                      className="w-full p-3 rounded-xl border text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    />
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    {state.cart.map((c) => (
                      <div key={c.item.id} className="flex justify-between text-sm">
                        <span>{c.item.name} × {c.quantity}</span>
                        <span className="font-medium">₦{(c.item.price * c.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Delivery Fee</span>
                      <span>₦{(currentVendor?.deliveryFee || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-amber-600">₦{(cartTotal + (currentVendor?.deliveryFee || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={handlePlaceOrder}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors"
                  >
                    Place Order
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Tracking Modal */}
        <AnimatePresence>
          {showOrder && (() => {
            const order = state.orders.find((o) => o.id === showOrder);
            if (!order) return null;
            const currentStep = statusSteps.indexOf(order.status);
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowOrder(null)}>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl p-6 w-full max-w-md"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Order Tracking</h2>
                    <button onClick={() => setShowOrder(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-500">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="space-y-0 relative">
                    {statusSteps.map((step, i) => (
                      <div key={step} className="flex items-start gap-4 pb-6 relative">
                        {i < statusSteps.length - 1 && (
                          <div className={`absolute left-[15px] top-7 w-0.5 h-full ${i < currentStep ? "bg-emerald-400" : "bg-gray-200"}`} />
                        )}
                        <div className={`p-2 rounded-full border-2 ${i <= currentStep ? "border-emerald-400 bg-emerald-50 text-emerald-600" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                          {statusIcons[step] || <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div className="pt-1">
                          <p className={`font-semibold text-sm ${i <= currentStep ? "text-gray-900" : "text-gray-400"}`}>
                            {step.charAt(0).toUpperCase() + step.slice(1)}
                          </p>
                          {i === currentStep && <p className="text-xs text-emerald-600 mt-0.5">Current</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowOrder(null)}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-colors mt-2"
                  >
                    Done
                  </button>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    );
  }

  /* ── Vendor Menu View ── */
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Back button + vendor header */}
      <button onClick={() => { setActiveVendor(null); setActiveCategory(null); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to vendors
      </button>
      {currentVendor && (
        <div className="relative rounded-2xl overflow-hidden mb-6">
          <div className="h-32 md:h-40 overflow-hidden">
            <img src={currentVendor.coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex items-end gap-4">
            <img src={currentVendor.image} alt={currentVendor.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-white shadow-lg object-cover" />
            <div className="text-white">
              <h2 className="text-xl md:text-2xl font-bold">{currentVendor.name}</h2>
              <div className="flex items-center gap-3 text-sm text-white/80 mt-1">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{currentVendor.rating}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{currentVendor.prepTime}</span>
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" />₦{currentVendor.deliveryFee}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all ${!activeCategory ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all ${activeCategory === cat ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, i) => (
          <motion.div
            key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
          >
            <div className="relative h-40 overflow-hidden">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              {item.isPopular && (
                <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" /> Popular
                </span>
              )}
              <button
                onClick={() => setSelectedItem(item)}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                <span className="font-bold text-amber-600">₦{item.price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{item.description}</p>
              <div className="flex items-center flex-wrap gap-1.5 mb-3">
                {item.dietary.map((d) => (
                  <span key={d} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">{d}</span>
                ))}
              </div>
              <button
                onClick={() => handleAddToCart(item)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </motion.div>
        ))}
      </div>
      {filteredItems.length === 0 && (
        <EmptyState icon={<Package className="w-12 h-12" />} title="No items available" desc="This vendor has no items in this category." />
      )}

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl overflow-hidden w-full max-w-md"
            >
              <div className="relative h-48">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-1">{selectedItem.name}</h2>
                <p className="text-2xl font-bold text-amber-600 mb-3">₦{selectedItem.price.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mb-4">{selectedItem.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedItem.dietary.map((d) => (
                    <span key={d} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">{d}</span>
                  ))}
                </div>
                <button
                  onClick={() => { handleAddToCart(selectedItem); setSelectedItem(null); }}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart / Checkout buttons */}
      {cartCount > 0 && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.05 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 z-40 bg-amber-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-bold">{cartCount} items</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm font-bold">₦{cartTotal.toLocaleString()}</span>
        </motion.button>
      )}
    </div>
  );
}

/* ──────────────── Vendor View ──────────────── */

function VendorView() {
  const { state, dispatch, getVendor, getFoodItems, getOrdersForVendor, getVendorForCurrentUser } = useApp();
  const vendor = getVendorForCurrentUser;
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "analytics">("orders");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);

  if (!vendor) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <EmptyState icon={<Store className="w-16 h-16" />} title="No Vendor Account" desc="You don't have a vendor account yet. Contact an admin to get set up." />
      </div>
    );
  }

  const menuItems = getFoodItems(vendor.id);
  const vendorOrders = getOrdersForVendor(vendor.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pendingOrders = vendorOrders.filter((o) => o.status === "pending");
  const activeOrders = vendorOrders.filter((o) => ["accepted", "preparing", "delivering"].includes(o.status));
  const completedOrders = vendorOrders.filter((o) => o.status === "completed");

  // Analytics
  const totalRevenue = vendorOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const totalOrders = vendorOrders.length;
  const popularItems = useMemo(() => {
    const count: Record<string, number> = {};
    vendorOrders.forEach((o) => o.items.forEach((i) => { count[i.name] = (count[i.name] || 0) + i.quantity; }));
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [vendorOrders]);

  const advanceStatus = (orderId: string, currentStatus: string) => {
    const idx = statusSteps.indexOf(currentStatus);
    if (idx < statusSteps.length - 1) {
      dispatch({ type: "UPDATE_ORDER_STATUS", payload: { orderId, status: statusSteps[idx + 1] as Order["status"] } });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Vendor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <img src={vendor.image} alt={vendor.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-200" />
          <div>
            <h2 className="text-xl font-bold">{vendor.name}</h2>
            <p className="text-sm text-gray-500">{vendor.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500"><Star className="w-3 h-3 text-amber-500 fill-amber-500" />{vendor.rating}</span>
              <button
                onClick={() => dispatch({ type: "TOGGLE_VENDOR_OPEN" })}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${vendor.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
              >
                {vendor.isOpen ? "Open" : "Closed"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {[["orders", "Orders"], ["menu", "Menu"], ["analytics", "Analytics"]].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`₦${totalRevenue.toLocaleString()}`} accent="border-l-emerald-400" />
          <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="Total Orders" value={totalOrders.toString()} accent="border-l-amber-400" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={pendingOrders.length.toString()} accent="border-l-orange-400" />
          <StatCard icon={<Package className="w-5 h-5" />} label="Completed" value={completedOrders.length.toString()} accent="border-l-blue-400" />
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {pendingOrders.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> New Orders ({pendingOrders.length})</h3>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <motion.div key={order.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.deliveryAddress}</span>
                      <span className="flex items-center gap-1">{order.paymentMethod === "card" ? <CreditCard className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}{order.paymentMethod}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => dispatch({ type: "UPDATE_ORDER_STATUS", payload: { orderId: order.id, status: "accepted" } })}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors"
                      >
                        <Check className="w-4 h-4 inline mr-1" /> Accept
                      </button>
                      <button
                        onClick={() => dispatch({ type: "UPDATE_ORDER_STATUS", payload: { orderId: order.id, status: "cancelled" } })}
                        className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl text-sm transition-colors"
                      >
                        <X className="w-4 h-4 inline mr-1" /> Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeOrders.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3">Active Orders ({activeOrders.length})</h3>
              <div className="space-y-3">
                {activeOrders.map((order) => (
                  <motion.div key={order.id} layout className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500"><Clock className="w-3 h-3 inline mr-1" />{new Date(order.createdAt).toLocaleTimeString()}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="space-y-1 mb-2 text-sm">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.name} × {item.quantity}</span>
                          <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => advanceStatus(order.id, order.status)}
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 inline mr-1" /> Move to {statusSteps[statusSteps.indexOf(order.status) + 1]?.charAt(0).toUpperCase() + statusSteps[statusSteps.indexOf(order.status) + 1]?.slice(1)}
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {pendingOrders.length === 0 && activeOrders.length === 0 && (
            <EmptyState icon={<Bell className="w-12 h-12" />} title="No orders yet" desc="New orders from customers will appear here." />
          )}

          {completedOrders.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer font-semibold text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" /> Completed Orders ({completedOrders.length})
              </summary>
              <div className="mt-3 space-y-2">
                {completedOrders.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-xl p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className="text-gray-500">₦{order.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Menu Tab */}
      {activeTab === "menu" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Menu Items ({menuItems.length})</h3>
            <button
              onClick={() => setShowAddItem(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-3 flex gap-3 items-center">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm truncate">{item.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {item.isAvailable ? "Available" : "Hidden"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{item.category}</p>
                  <p className="font-bold text-amber-600 text-sm">₦{item.price.toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditItem(item)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Edit className="w-4 h-4" /></button>
                  <button
                    onClick={() => dispatch({ type: "DELETE_FOOD_ITEM", payload: item.id })}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-400"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => dispatch({ type: "UPDATE_FOOD_ITEM", payload: { ...item, isAvailable: !item.isAvailable } })}
                    className={`p-2 rounded-lg ${item.isAvailable ? "hover:bg-gray-100 text-gray-500" : "hover:bg-emerald-50 text-emerald-500"}`}
                  >
                    {item.isAvailable ? <EyeOff className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {menuItems.length === 0 && (
            <EmptyState icon={<Package className="w-12 h-12" />} title="No menu items" desc="Add your first menu item to start receiving orders." />
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /> Popular Dishes</h3>
            {popularItems.length > 0 ? (
              <div className="space-y-3">
                {popularItems.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{name}</span>
                        <span className="text-gray-500">{count} sold</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(count / Math.max(...popularItems.map(([, c]) => c))) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No completed orders yet.</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-amber-500" /> Order Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-amber-50 rounded-2xl">
                <p className="text-2xl font-bold text-amber-600">{totalOrders}</p>
                <p className="text-xs text-gray-500">Total Orders</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-2xl">
                <p className="text-2xl font-bold text-emerald-600">₦{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <p className="text-2xl font-bold text-blue-600">{activeOrders.length}</p>
                <p className="text-xs text-gray-500">Active Orders</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-2xl">
                <p className="text-2xl font-bold text-purple-600">{menuItems.length}</p>
                <p className="text-xs text-gray-500">Menu Items</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      <AnimatePresence>
        {(showAddItem || editItem) && (
          <MenuItemModal
            editItem={editItem}
            vendorId={vendor.id}
            onClose={() => { setShowAddItem(false); setEditItem(null); }}
            categories={state.categories.filter((c) => c.isActive).map((c) => c.name)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItemModal({
  editItem, vendorId, onClose, categories,
}: {
  editItem: FoodItem | null;
  vendorId: string;
  onClose: () => void;
  categories: string[];
}) {
  const { dispatch } = useApp();
  const [name, setName] = useState(editItem?.name || "");
  const [description, setDescription] = useState(editItem?.description || "");
  const [price, setPrice] = useState(editItem?.price.toString() || "");
  const [category, setCategory] = useState(editItem?.category || categories[0] || "");
  const [image, setImage] = useState(editItem?.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80");

  const handleSave = () => {
    if (!name || !price) return;
    const item: FoodItem = {
      id: editItem?.id || `f-${Date.now()}`,
      vendorId,
      name,
      description,
      price: parseInt(price),
      image,
      category,
      dietary: [],
      isAvailable: editItem?.isAvailable ?? true,
      isPopular: editItem?.isPopular ?? false,
      rating: editItem?.rating ?? 0,
    };
    if (editItem) {
      dispatch({ type: "UPDATE_FOOD_ITEM", payload: item });
    } else {
      dispatch({ type: "ADD_FOOD_ITEM", payload: item });
    }
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{editItem ? "Edit Item" : "Add Menu Item"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" placeholder="e.g. Jollof Rice" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 rounded-xl border text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-amber-400/50" placeholder="Describe your dish..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₦)</label>
              <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className="w-full p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50" placeholder="3500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors">
            {editItem ? "Update Item" : "Add Item"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ──────────────── Admin View ──────────────── */

function AdminView() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState<"vendors" | "users" | "categories" | "analytics">("vendors");
  const [newCatName, setNewCatName] = useState("");

  const totalRevenue = state.orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const totalOrders = state.orders.length;
  const activeVendors = state.vendors.filter((v) => v.isOpen).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-amber-500" /> Admin Dashboard</h2>
        <div className="flex gap-2">
          {[["vendors", "Vendors"], ["users", "Users"], ["categories", "Categories"], ["analytics", "Analytics"]].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeTab === tab ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Store className="w-5 h-5" />} label="Total Vendors" value={state.vendors.length.toString()} sub={`${activeVendors} open`} accent="border-l-amber-400" />
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={state.users.length.toString()} accent="border-l-blue-400" />
        <StatCard icon={<ShoppingCart className="w-5 h-5" />} label="Total Orders" value={totalOrders.toString()} accent="border-l-emerald-400" />
        <StatCard icon={<DollarSign className="w-5 h-5" />} label="Revenue" value={`₦${totalRevenue.toLocaleString()}`} accent="border-l-purple-400" />
      </div>

      {/* Vendors Tab */}
      {activeTab === "vendors" && (
        <div className="space-y-3">
          {state.vendors.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center gap-4">
              <img src={v.image} alt={v.name} className="w-12 h-12 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{v.name}</h4>
                <p className="text-xs text-gray-500">{v.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${v.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {v.isOpen ? "Open" : "Closed"}
                </span>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_VENDOR_APPROVAL", payload: v.id })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${v.isApproved ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {v.isApproved ? "Approved" : "Pending"}
                </button>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_VENDOR_SUSPEND", payload: v.id })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${v.isSuspended ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {v.isSuspended ? "Suspended" : "Active"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-3">
          {state.users.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{u.name}</h4>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-600">{u.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
              placeholder="New category name..."
              className="flex-1 p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <button
              onClick={() => {
                if (newCatName.trim()) {
                  dispatch({ type: "ADD_CATEGORY", payload: { id: `cat-${Date.now()}`, name: newCatName.trim(), icon: "CircleDot", isActive: true } });
                  setNewCatName("");
                }
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {state.categories.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{c.name}</span>
                <button
                  onClick={() => dispatch({ type: "TOGGLE_CATEGORY", payload: c.id })}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" /> Orders Overview</h3>
            <div className="space-y-3">
              {["pending", "accepted", "preparing", "delivering", "completed", "cancelled"].map((status) => {
                const count = state.orders.filter((o) => o.status === status).length;
                const total = state.orders.length || 1;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${status === "cancelled" ? "bg-red-400" : "bg-emerald-400"}`} style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-amber-500" /> Vendor Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Vendors</span>
                <span className="font-semibold">{state.vendors.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Open</span>
                <span className="font-semibold text-emerald-600">{activeVendors}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Approved</span>
                <span className="font-semibold text-blue-600">{state.vendors.filter((v) => v.isApproved).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Suspended</span>
                <span className="font-semibold text-red-600">{state.vendors.filter((v) => v.isSuspended).length}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-500">Total Revenue</span>
                <span className="font-bold text-lg">₦{totalRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────── Capstone Documentation View ──────────────── */

function CapstoneDocView() {
  const [activeSection, setActiveSection] = useState(CAPSTONE_SECTIONS[0].id);

  const section = CAPSTONE_SECTIONS.find((s) => s.id === activeSection) || CAPSTONE_SECTIONS[0];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">3MTT Capstone Project Documentation</h1>
        <p className="text-gray-500">Fellow: Idris Yusuf Sani — Software Development Track</p>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CAPSTONE_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all ${activeSection === s.id ? "bg-amber-500 text-white border-amber-500 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 shadow-sm"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              {section.id === "ps" ? <CircleAlert className="w-5 h-5" /> :
               section.id === "obj" ? <Target className="w-5 h-5" /> :
               section.id === "arch" ? <Grid3x3 className="w-5 h-5" /> :
               section.id === "erd" ? <GitCommitHorizontal className="w-5 h-5" /> :
               section.id === "api" ? <Code className="w-5 h-5" /> :
               section.id === "folder" ? <FolderTree className="w-5 h-5" /> :
               section.id === "tech" ? <Zap className="w-5 h-5" /> :
               section.id === "testing" ? <CheckCircle className="w-5 h-5" /> :
               section.id === "lit" ? <BookOpen className="w-5 h-5" /> :
               section.id === "method" ? <GitBranch className="w-5 h-5" /> :
               section.id === "slides" ? <Presentation className="w-5 h-5" /> :
               section.id === "risks" ? <Shield className="w-5 h-5" /> :
               section.id === "future" ? <Rocket className="w-5 h-5" /> :
               section.id === "conclusion" ? <FileText className="w-5 h-5" /> :
               <Link className="w-5 h-5" />}
            </span>
            {section.title}
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
            {section.content}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ──────────────── Exported role views ──────────────── */

export { CustomerView, VendorView, AdminView, CapstoneDocView };