const Donation = require("../models/Donation");
const RequestNeed = require("../models/RequestNeed");
const DonationTransaction = require("../models/DonationTransaction");
const User = require("../models/User");
const Product = require("../models/Product");
const Meal = require("../models/Meals");
const Feedback = require("../models/Feedback");
const Delivery = require("../models/Delivery");
const mongoose = require("mongoose");

// Access Role enum from User model
const Role = {
  ADMIN: 'admin',
  ONG: 'ong',
  RESTAURANT: 'restaurant',
  SUPERMARKET: 'supermarket',
  STUDENT: 'student',
  TRANSPORTER: 'transporter',
  PERSONALDONOR: 'personaldonor'
};

async function getStatistics(req, res) {
  try {
    const { dateRange = "30d", category = "all" } = req.query;

    // Calculate date range
    let startDate;
    const endDate = new Date();
    if (dateRange === "7d") startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (dateRange === "30d") startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else if (dateRange === "90d") startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    else startDate = new Date(0); // All time

    // Category filter
    const categoryFilter = category === "all" ? {} : { category };

    // Generate placeholder dates for userGrowth to ensure the chart always has data points
    const generateDateRange = (start, end) => {
      const dates = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push({ date: currentDate.toISOString().split("T")[0], count: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };

    // Run independent queries in parallel for better performance
    const [
      // 1. User Statistics
      totalUsers,
      userRolesRaw,
      userGrowthRaw,
      // 2. Donation Statistics
      totalDonations,
      donationStatus,
      donationTrends,
      expiringDonations,
      topDonors,
      // 3. Request Statistics
      totalRequests,
      requestStatus,
      requestTrends,
      topRecipients,
      // 4. Transaction Statistics
      totalTransactions,
      transactionStatus,
      // 5. Product and Meal Statistics
      totalProducts,
      totalMeals,
      productBreakdown,
      mealBreakdown,
      // 6. Platform Health Metrics
      foodDistributed,
      foodWastePrevented,
      // 7. Feedback Statistics
      totalFeedbacks,
      averageRating,
      feedbackTrends,
      // 8. Delivery Statistics
      totalDeliveries,
      deliveryStatus,
      deliveryTrends,
    ] = await Promise.all([
      // 1. User Statistics
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $project: { role: "$_id", count: 1, _id: 0 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),
      // 2. Donation Statistics
      Donation.countDocuments(categoryFilter),
      Donation.aggregate([
        { $match: categoryFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]).then((result) =>
        result.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {})
      ),
      Donation.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate }, ...categoryFilter } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),
      Donation.countDocuments({
        expirationDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        status: "pending",
        ...categoryFilter,
      }),
      Donation.aggregate([
        { $match: categoryFilter },
        {
          $group: {
            _id: "$donor",
            donationCount: { $sum: 1 },
            totalItems: { $sum: { $add: [{ $sum: "$products.quantity" }, { $sum: "$meals.quantity" }] } },
          },
        },
        { $sort: { donationCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "donor" } },
        { $unwind: "$donor" },
        { $project: { _id: "$donor._id", name: "$donor.name", donationCount: 1, totalItems: 1 } },
      ]),
      // 3. Request Statistics
      RequestNeed.countDocuments(categoryFilter),
      RequestNeed.aggregate([
        { $match: categoryFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]).then((result) =>
        result.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {})
      ),
      RequestNeed.aggregate([
        { $match: { created_at: { $gte: startDate, $lte: endDate }, ...categoryFilter } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),
      RequestNeed.aggregate([
        { $match: categoryFilter },
        {
          $group: {
            _id: "$recipient",
            requestCount: { $sum: 1 },
            totalItems: {
              $sum: {
                $add: [
                  { $sum: "$requestedProducts.quantity" },
                  { $sum: "$requestedMeals.quantity" },
                ],
              },
            },
          },
        },
        { $sort: { requestCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "recipient" } },
        { $unwind: "$recipient" },
        { $project: { _id: "$recipient._id", name: "$recipient.name", requestCount: 1, totalItems: 1 } },
      ]),
      // 4. Transaction Statistics
      DonationTransaction.countDocuments(),
      DonationTransaction.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]).then((result) =>
        result.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {})
      ),
      // 5. Product and Meal Statistics
      Product.countDocuments(),
      Meal.countDocuments(),
      Product.aggregate([
        { $match: categoryFilter },
        { $group: { _id: "$productType", count: { $sum: "$totalQuantity" } } },
        { $project: { productType: "$_id", count: 1, _id: 0 } },
      ]).then((result) =>
        result.reduce((acc, { productType, count }) => ({ ...acc, [productType]: count }), {})
      ),
      Meal.aggregate([
        { $match: categoryFilter },
        { $group: { _id: "$mealType", count: { $sum: "$quantity" } } },
        { $project: { mealType: "$_id", count: 1, _id: 0 } },
      ]).then((result) =>
        result.reduce((acc, { mealType, count }) => ({ ...acc, [mealType]: count }), {})
      ),
      // 6. Platform Health Metrics
      DonationTransaction.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: { $sum: "$allocatedProducts.quantity" } },
            totalMeals: { $sum: { $sum: "$allocatedMeals.quantity" } },
          },
        },
      ]).then((result) => (result[0] ? result[0].totalProducts + result[0].totalMeals : 0)),
      Product.aggregate([
        { $match: { donation: { $exists: true } } },
        {
          $group: {
            _id: null,
            totalWeight: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$weightPerUnit", null] }, { $ne: ["$totalQuantity", null] }] },
                  { $multiply: ["$weightPerUnit", "$totalQuantity"] },
                  0,
                ],
              },
            },
          },
        },
      ]).then((result) => (result[0] ? result[0].totalWeight : 0)),
      // 7. Feedback Statistics
      Feedback.countDocuments(),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
          },
        },
      ]).then((result) => (result[0] ? parseFloat(result[0].averageRating.toFixed(2)) : 0)),
      Feedback.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),
      // 8. Delivery Statistics
      Delivery.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Delivery.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]).then((result) =>
        result.reduce((acc, { status, count }) => ({ ...acc, [status]: count }), {})
      ),
      Delivery.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]),
    ]);

    // Ensure all roles are included in userRoles, even those with zero counts
    const userRoles = Object.values(Role).reduce((acc, role) => {
      const found = userRolesRaw.find((item) => item.role === role);
      acc[role] = found ? found.count : 0;
      return acc;
    }, {});

    // Merge userGrowth with placeholder dates to ensure all dates in the range are represented
    const placeholderDates = generateDateRange(startDate, endDate);
    const userGrowthMap = userGrowthRaw.reduce((acc, entry) => {
      acc[entry.date] = entry.count;
      return acc;
    }, {});
    const userGrowth = placeholderDates.map((entry) => ({
      date: entry.date,
      count: userGrowthMap[entry.date] || 0,
    }));

    // Compile the response
    const stats = {
      totalUsers,
      userRoles,
      totalDonations,
      donationStatus,
      totalRequests,
      requestStatus,
      totalTransactions,
      transactionStatus,
      totalProducts,
      totalMeals,
      expiringDonations,
      foodDistributed,
      foodWastePrevented,
      totalFeedbacks,
      averageRating,
      feedbackTrends,
      totalDeliveries,
      deliveryStatus,
      deliveryTrends,
      topDonors,
      topRecipients,
      donationTrends,
      requestTrends,
      userGrowth,
      productBreakdown,
      mealBreakdown,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    if (error.name === "MongoServerError") {
      res.status(500).json({ message: "Database error while fetching statistics", error: error.message });
    } else {
      res.status(500).json({ message: "Failed to fetch statistics", error: error.message });
    }
  }
}

module.exports = { getStatistics };