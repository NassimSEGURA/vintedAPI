const express = require("express"); // import du package express
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid = require("uid2");

const User = require("../Models/User.js"); // import du modèle User

// creation du router afin de pouvoir exporter notre route et ne pas avoir à recréer un server (comme app dans index.js)
const router = express.Router();

router.post("/user/signup", async (req, res) => {
  try {
    const newUser = new User({
      account: {
        username: req.body.username,
      },
      email: req.body.email,
      password: req.body.password,
      newsletter: req.body.newsletter,
    });

    const mailAlreadyUsed = await User.findOne({ email: req.body.email });
    if (mailAlreadyUsed) {
      return res.status(400).json({ message: "Email already used" });
    } else if (
      newUser.account.username === "" ||
      newUser.email === "" ||
      newUser.password === ""
    ) {
      return res.status(400).json({ message: "Missing parameters" });
    } else if (newUser.password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    } else if (newUser.account.username.length > 30) {
      return res
        .status(400)
        .json({ message: "Username must be less than 30 characters" });
    } else if (newUser.email.length > 50) {
      return res
        .status(400)
        .json({ message: "Email must be less than 50 characters" });
    } else if (newUser.newsletter !== true && newUser.newsletter !== false) {
      return res.status(400).json({ message: "Newsletter must be a boolean" });
    } else {
      const salt = uid(16);
      const token = uid(16);
      const saltedPassword = req.body.password + salt;
      const hash = SHA256(saltedPassword).toString(encBase64);
      newUser.token = token;
      newUser.password = hash;
      newUser.salt = salt;
      await newUser.save();
      return res.status(200).json(newUser);
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const userFound = await User.findOne({ email: req.body.email });
    if (userFound) {
      const newSaltedPassword = req.body.password + userFound.salt;
      const newHash = SHA256(newSaltedPassword).toString(encBase64);
      if (newHash === userFound.password) {
        return res.status(200).json({
          _id: userFound._id,
          token: userFound.token,
          account: userFound.account,
        });
      } else {
        return res
          .status(400)
          .json({ message: "Email ou mot de passe incorrect" });
      }
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
