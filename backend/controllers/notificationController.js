const Notification = require("../models/Notification");


// ==========================================
// GET MY NOTIFICATIONS (PAGINATED)
// ==========================================
exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const query = {
      recipient: req.user._id,
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("thread", "title");

    const total = await Notification.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      notifications,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// GET UNREAD COUNT (FAST ENDPOINT)
// ==========================================
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ unreadCount: count });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// MARK ONE AS READ
// ==========================================
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==========================================
// MARK ALL AS READ
// ==========================================
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};  