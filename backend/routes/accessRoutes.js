// Access request routes
const express = require("express");
const {
  requestAccess,
  getAccessRequests,
  approveAccess,
  rejectAccess
} = require("../controllers/accessController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/request", protect, authorizeRoles("doctor"), requestAccess);
router.get("/requests", protect, authorizeRoles("patient"), getAccessRequests);
router.put("/approve/:id", protect, authorizeRoles("patient"), approveAccess);
router.delete("/reject/:id", protect, authorizeRoles("patient"), rejectAccess);

module.exports = router;
