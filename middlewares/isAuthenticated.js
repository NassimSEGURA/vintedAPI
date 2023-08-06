const User = require("../Models/User");

const isAuthenticated = async (req, res, next) => {
  const receivedToken = req.headers.authorization.replace("Bearer ", "");
  const foundUser = await User.findOne({ token: receivedToken });
  //  User.findOne({ token: receivedToken });
  if (!foundUser) {
    return res.status(401).json({ message: "Unauthorized" });
  } else {
    next();
  }
};

module.exports = isAuthenticated;
