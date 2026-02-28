const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  uploadMaterial,
  uploadMaterialFile,
  getMaterials,
  deleteMaterial,
} = require("../controllers/studyMaterialController");

router.post("/", protect, uploadMaterial);
router.post("/upload-file", protect, upload.single("file"), uploadMaterialFile);
router.get("/", protect, getMaterials);
router.delete("/:id", protect, deleteMaterial);

module.exports = router;
