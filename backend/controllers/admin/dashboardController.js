import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfYear(d) {
  return new Date(d.getFullYear(), 0, 1);
}

function startOfWeekMonday(d) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  x.setDate(x.getDate() + diff);
  return x;
}

export const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeekMonday(now);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    const paidMatch = { 'payment.status': { $in: ['paid', 'partially_refunded'] } };

    const [ordersByStatus, usersByType, totalProducts, recentOrders, lowStock, revenueBuckets, salesByChannel, pricingImpact] =
      await Promise.all([
        Order.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $project: { _id: 0, status: '$_id', count: 1 } },
        ]),
        User.aggregate([
          { $group: { _id: '$userType', count: { $sum: 1 } } },
          { $project: { _id: 0, userType: '$_id', count: 1 } },
        ]),
        Product.countDocuments({}),
        Order.find({})
          .sort({ createdAt: -1 })
          .limit(10)
          .select('_id createdAt customerName email total status placedByType payment.status payment.amount'),
        Product.aggregate([
          { $unwind: '$variants' },
          {
            $match: {
              'variants.isEnabled': true,
              $expr: { $lte: ['$variants.stockQty', '$variants.lowStockThreshold'] },
            },
          },
          {
            $project: {
              _id: 0,
              productId: '$_id',
              productName: '$name',
              sku: '$variants.sku',
              size: '$variants.size',
              color: '$variants.color',
              material: '$variants.material',
              stockQty: '$variants.stockQty',
              lowStockThreshold: '$variants.lowStockThreshold',
            },
          },
          { $limit: 50 },
        ]),
        Order.aggregate([
          { $match: { ...paidMatch, 'payment.paidAt': { $ne: null } } },
          {
            $facet: {
              daily: [
                { $match: { 'payment.paidAt': { $gte: dayStart } } },
                { $group: { _id: null, revenue: { $sum: '$payment.amount' } } },
              ],
              weekly: [
                { $match: { 'payment.paidAt': { $gte: weekStart } } },
                { $group: { _id: null, revenue: { $sum: '$payment.amount' } } },
              ],
              monthly: [
                { $match: { 'payment.paidAt': { $gte: monthStart } } },
                { $group: { _id: null, revenue: { $sum: '$payment.amount' } } },
              ],
              yearly: [
                { $match: { 'payment.paidAt': { $gte: yearStart } } },
                { $group: { _id: null, revenue: { $sum: '$payment.amount' } } },
              ],
            },
          },
        ]),
        Order.aggregate([
          { $match: paidMatch },
          {
            $group: {
              _id: '$placedByType',
              revenue: { $sum: '$payment.amount' },
              orders: { $sum: 1 },
            },
          },
          { $project: { _id: 0, channel: '$_id', revenue: 1, orders: 1 } },
        ]),
        Order.aggregate([
          { $unwind: '$items' },
          {
            $group: {
              _id: null,
              bulkDiscountLines: { $sum: { $cond: ['$items.pricing.bulkDiscountApplied', 1, 0] } },
              bulkDiscountValue: {
                $sum: {
                  $cond: [
                    '$items.pricing.bulkDiscountApplied',
                    {
                      $multiply: [
                        '$items.quantity',
                        { $subtract: ['$items.pricing.retailUnitPrice', { $ifNull: ['$items.pricing.agentUnitPrice', '$items.pricing.retailUnitPrice'] }] },
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
          { $project: { _id: 0, bulkDiscountLines: 1, bulkDiscountValue: 1 } },
        ]),
      ]);

    const revenue = revenueBuckets?.[0] || {};
    const pickRevenue = (bucket) => (bucket?.[0]?.revenue ? bucket[0].revenue : 0);

    const totalOrders = await Order.countDocuments({});

    // Growth placeholders: requires storing historical snapshots or computing “previous period”.
    // Implemented as 0 for now (schema supports it; admin can extend later).
    const growth = { dailyPct: 0, weeklyPct: 0, monthlyPct: 0, yearlyPct: 0 };

    res.json({
      revenue: {
        daily: pickRevenue(revenue.daily),
        weekly: pickRevenue(revenue.weekly),
        monthly: pickRevenue(revenue.monthly),
        yearly: pickRevenue(revenue.yearly),
        growthPct: growth,
      },
      totals: {
        orders: totalOrders,
        products: totalProducts,
      },
      ordersByStatus,
      usersByType,
      lowStockAlerts: lowStock,
      recentOrders,
      salesByChannel,
      dynamicPricingImpact: pricingImpact?.[0] || { bulkDiscountLines: 0, bulkDiscountValue: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

