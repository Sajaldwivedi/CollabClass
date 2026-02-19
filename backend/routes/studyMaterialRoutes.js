const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  uploadMaterial,
  getMaterials,
  deleteMaterial,
} = require("../controllers/studyMaterialController");

router.post("/", protect, uploadMaterial);
router.get("/", protect, getMaterials);
router.delete("/:id", protect, deleteMaterial);

module.exports = router;
