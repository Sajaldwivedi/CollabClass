const StudyMaterial = require("../models/StudyMaterial");

// ===============================
// Upload Study Material
// ===============================
const uploadMaterial = async (req, res) => {
  try {
    const { title, description, subject, section, fileUrl } = req.body;

    if (!title || !subject || !section || !fileUrl) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const material = await StudyMaterial.create({
      title,
      description,
      subject,
      section,
      fileUrl,
      uploadedBy: req.user._id,
      uploaderRole: req.user.role,
    });

    res.status(201).json(material);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Get Study Materials (Filtered + Paginated)
// ===============================
const getMaterials = async (req, res) => {
  try {
    const { subject, section, page = 1, limit = 5 } = req.query;

    let filter = {};

    // Students only see their section
    if (req.user.role === "student") {
      filter.section = req.user.section;
    }

    if (subject) {
      filter.subject = subject;
    }

    if (section && req.user.role === "teacher") {
      filter.section = section;
    }

    const skip = (page - 1) * limit;

    const totalMaterials = await StudyMaterial.countDocuments(filter);

    const materials = await StudyMaterial.find(filter)
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const totalPages = Math.ceil(totalMaterials / limit);

    res.json({
      materials,
      currentPage: parseInt(page),
      totalPages,
      totalMaterials,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Upload Study Material (File)
// ===============================
const uploadMaterialFile = async (req, res) => {
  try {
    const { title, description, subject, section } = req.body;

    if (!title || !subject || !section || !req.file) {
      return res.status(400).json({ message: "Required fields missing (title, subject, section, file)" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const material = await StudyMaterial.create({
      title,
      description,
      subject,
      section,
      fileUrl,
      uploadedBy: req.user._id,
      uploaderRole: req.user.role,
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Delete Study Material
// ===============================
const deleteMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    // Allow deletion if:
    // 1. Uploader deletes their own material
    // 2. Teacher deletes any material

    if (
      material.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "teacher"
    ) {
      return res.status(403).json({
        message: "Not authorized to delete this material",
      });
    }

    await material.deleteOne();

    res.json({ message: "Material deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  uploadMaterial,
  uploadMaterialFile,
  getMaterials,
  deleteMaterial,
};
