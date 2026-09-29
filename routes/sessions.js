const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const auth = require("../middleware/auth");
const requireRole = require("../middleware/roles");

// ---- Teacher ----
// Start of today in Lagos time (UTC+1, no daylight saving)
const startOfLagosDay = () => {
  const now = new Date();
  const shifted = new Date(now.getTime() + 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 60 * 60 * 1000);
};

router.post("/sign-in", auth, requireRole("teacher"), async (req, res) => {
  try {
    const already = await Session.findOne({
      teacher: req.user.id,
      signIn: { $gte: startOfLagosDay() },
    });
    if (already) {
      return res
        .status(409)
        .json({ message: "You have already signed in today" });
    }
    const s = await Session.create({ teacher: req.user.id });
    res.status(201).json(s);
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ message: "You are already signed in" });
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/sign-out", auth, requireRole("teacher"), async (req, res) => {
  const s = await Session.findOneAndUpdate(
    { teacher: req.user.id, open: true },
    { $set: { signOut: new Date(), open: false } },
    { new: true },
  );
  if (!s) return res.status(400).json({ message: "You are not signed in" });
  res.json(s);
});

router.get("/me/status", auth, requireRole("teacher"), async (req, res) => {
  const s = await Session.findOne({ teacher: req.user.id, open: true });
  res.json({ signedIn: !!s, since: s?.signIn ?? null });
});

// ---- Admin ----
router.get("/admin/active", auth, requireRole("admin"), async (req, res) => {
  res.json(
    await Session.find({ open: true }).populate("teacher", "name email"),
  );
});

router.get("/admin/log", auth, requireRole("admin"), async (req, res) => {
  const start = new Date(req.query.date || Date.now());
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  res.json(
    await Session.find({ signIn: { $gte: start, $lt: end } })
      .populate("teacher", "name email")
      .sort({ signIn: -1 }),
  );
});

router.patch(
  "/admin/:id/close",
  auth,
  requireRole("admin"),
  async (req, res) => {
    const s = await Session.findOneAndUpdate(
      { _id: req.params.id, open: true },
      {
        $set: {
          signOut: req.body.signOut || new Date(),
          open: false,
          note: req.body.note,
        },
      },
      { new: true },
    );
    if (!s) return res.status(404).json({ message: "No open session found" });
    res.json(s);
  },
);

module.exports = router;
