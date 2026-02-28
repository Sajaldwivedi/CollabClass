const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ===============================
// Register User
// ===============================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, section } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let isUniversityUser = false;
    let regNo = null;

    if (email.endsWith("@srmap.edu.in")) {
      isUniversityUser = true;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      section,
      regNo,
      isUniversityUser,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      section: user.section,
      isUniversityUser: user.isUniversityUser,
      regNo: user.regNo,
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Login User
// ===============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && user.password !== "google-auth" && await bcrypt.compare(password, user.password)) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        section: user.section,
        isUniversityUser: user.isUniversityUser,
        regNo: user.regNo,
        token: generateToken(user._id),
      });
    }

    return res.status(401).json({ message: "Invalid email or password" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// ===============================
// Google Authentication
// ===============================
const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });

    let isUniversityUser = false;
    let regNo = null;

    if (email.endsWith("@srmap.edu.in")) {
      isUniversityUser = true;

      if (name.includes("|")) {
        regNo = name.split("|")[1].trim();
      }
    }

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "google-auth",
        role: "student",
        regNo,
        isUniversityUser,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      section: user.section,
      isUniversityUser: user.isUniversityUser,
      regNo: user.regNo,
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(401).json({ message: "Google authentication failed" });
  }
};

// ===============================
// Update Section
// ===============================
const updateSection = async (req, res) => {
  try {
    const { section } = req.body;

    if (!section || !section.trim()) {
      return res.status(400).json({ message: "Section is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.section = section.trim();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      section: user.section,
      isUniversityUser: user.isUniversityUser,
      regNo: user.regNo,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  updateSection,
};
