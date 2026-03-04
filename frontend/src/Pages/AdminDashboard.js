import React, { useEffect, useMemo, useState } from "react";
import authFetch from "../utils/authFetch";
import Toast from "../components/Toast";

function formatMoney(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { style: "currency", currency: "INR" });
}

function pick(map, key, fallback = 0) {
  if (!Array.isArray(map)) return fallback;
  const found = map.find((x) => x && (x.status === key || x.userType === key || x.channel === key));
  return found?.count ?? found?.orders ?? fallback;
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });
  const closeToast = () => setToast(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await authFetch("/api/admin/dashboard/summary");
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Failed to load dashboard");
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) showToast(e.message || "Failed to load dashboard", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    const revenue = data?.revenue || {};
    const totals = data?.totals || {};
    return [
      { label: "Revenue (Today)", value: formatMoney(revenue.daily) },
      { label: "Revenue (This Week)", value: formatMoney(revenue.weekly) },
      { label: "Total Orders", value: String(totals.orders ?? 0) },
      { label: "Total Products", value: String(totals.products ?? 0) },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 13v5m4-9v9m4-13v13" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 text-lg">Real-time business monitoring</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {cards.map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-600 transform hover:scale-105 transition-all duration-300"
            >
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{c.label}</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">{c.value}</p>
            </div>
          ))}
        </div>

        {/* 2-column panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders by status */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-1">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">Orders by Status</h2>
            <div className="space-y-3">
              {[
                "order_received",
                "payment_verified",
                "design_converted",
                "pre_flight_approval",
                "in_production",
                "printed",
                "quality_check",
                "shipped",
                "delivered",
              ].map((s) => (
                <div key={s} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-gray-800">{s.replaceAll("_", " ").toUpperCase()}</span>
                  <span className="text-sm font-extrabold text-indigo-700">{pick(data?.ordersByStatus, s, 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-gray-900">Recent Orders</h2>
              <div className="text-sm font-bold text-gray-600">
                Agent vs User:{" "}
                <span className="text-indigo-700">
                  {pick(data?.salesByChannel, "agent", 0)} / {pick(data?.salesByChannel, "user", 0)}
                </span>
              </div>
            </div>

            {(!data?.recentOrders || data.recentOrders.length === 0) ? (
              <div className="text-center text-gray-500 py-10">No recent orders.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 uppercase text-gray-600 text-xs font-semibold">
                    <tr>
                      <th className="p-3 border-b">Order</th>
                      <th className="p-3 border-b">Customer</th>
                      <th className="p-3 border-b">Channel</th>
                      <th className="p-3 border-b">Status</th>
                      <th className="p-3 border-b text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.recentOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-mono text-xs text-gray-700">{String(o._id).slice(-10)}</td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{o.customerName || "-"}</div>
                          <div className="text-xs text-gray-500">{o.email || "-"}</div>
                        </td>
                        <td className="p-3 text-sm font-bold text-gray-800">{(o.placedByType || "guest").toUpperCase()}</td>
                        <td className="p-3 text-sm font-bold text-gray-800">{String(o.status || "").replaceAll("_", " ").toUpperCase()}</td>
                        <td className="p-3 text-right font-extrabold text-gray-900">{formatMoney(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low stock */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">Low Stock Alerts</h2>
            {(!data?.lowStockAlerts || data.lowStockAlerts.length === 0) ? (
              <div className="text-center text-gray-500 py-10">No low-stock variants.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 uppercase text-gray-600 text-xs font-semibold">
                    <tr>
                      <th className="p-3 border-b">Product</th>
                      <th className="p-3 border-b">Variant</th>
                      <th className="p-3 border-b text-right">Stock</th>
                      <th className="p-3 border-b text-right">Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.lowStockAlerts.map((v, idx) => (
                      <tr key={`${v.productId}-${v.sku || idx}`} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-bold text-gray-900">{v.productName}</td>
                        <td className="p-3 text-sm text-gray-700">
                          {[
                            v.sku ? `SKU ${v.sku}` : null,
                            v.size ? `Size ${v.size}` : null,
                            v.color ? `Color ${v.color}` : null,
                            v.material ? `Material ${v.material}` : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </td>
                        <td className="p-3 text-right font-extrabold text-red-600">{v.stockQty}</td>
                        <td className="p-3 text-right font-bold text-gray-700">{v.lowStockThreshold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Users */}
          <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-1">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">Users</h2>
            <div className="space-y-3">
              {["user", "agent", "admin"].map((t) => (
                <div key={t} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-gray-800">{t.toUpperCase()}</span>
                  <span className="text-sm font-extrabold text-indigo-700">{pick(data?.usersByType, t, 0)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
              <p className="text-sm font-bold text-indigo-100 uppercase tracking-wide">Bulk pricing impact</p>
              <p className="text-2xl font-extrabold mt-2">{String(data?.dynamicPricingImpact?.bulkDiscountLines ?? 0)} lines</p>
              <p className="text-sm font-semibold text-indigo-100 mt-1">
                Est. value: {formatMoney(data?.dynamicPricingImpact?.bulkDiscountValue ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

