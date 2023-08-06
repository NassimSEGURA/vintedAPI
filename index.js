require("dotenv").config();
const express = require("express"); // import du package express
const cors = require("cors");
const mongoose = require("mongoose"); // import du package mongoose

const app = express(); // creation de l'application express
const port = 3000; // creation de la variable port

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes, offerRoutes, cors(), express.json());

app.get("/", (req, res) => {
  return res.status(200).json("Welcome to Vinted API");
});

app.all("*", (req, res) => {
  return res.status(404).json("Page not found");
});
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});
