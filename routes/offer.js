const express = require("express"); // import du package express
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/isAuthenticated");

const Offer = require("../Models/Offer");
const User = require("../Models/User");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
cloudinary.api.create_folder("/vinted/offers");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const newOffer = new Offer({
        product_name: req.body.product_name,
        product_description: req.body.product_description,
        product_price: req.body.product_price,
        product_details: JSON.parse(req.body.product_details),
        product_image: {},
        owner: {},
      });
      if (
        req.body.product_description === "" ||
        req.body.product_description.length > 500
      ) {
        return res
          .status(400)
          .json({ message: "Product description is not valid" });
      } else if (
        req.body.product_name === "" ||
        req.body.product_name.length > 50
      ) {
        return res.status(400).json({ message: "Product name is not valid" });
      } else if (
        req.body.product_price === "" ||
        req.body.product_price > 100000
      ) {
        return res.status(400).json({ message: "Product price is not valid" });
      } else {
        const ownerFound = await User.findById(req.body.ownerId).populate(
          "account"
        );

        newOffer.owner = ownerFound;
        const convertedFile = convertToBase64(req.files.picture);
        const cloudinaryResponse = await cloudinary.uploader.upload(
          convertedFile,
          { folder: "/vinted/offers", public_id: newOffer._id }
        );
        newOffer.product_image.secure_url = cloudinaryResponse.secure_url;
        newOffer.product_image.public_id = cloudinaryResponse.public_id;
        await newOffer.save();
        return res.status(200).json(newOffer);
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
);

router.put("/offer/update", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const offerToUpdate = await Offer.findById(req.body.id);
    if (req.body.product_name) {
      offerToUpdate.product_name = req.body.product_name;
    }
    if (req.body.product_description) {
      offerToUpdate.product_description = req.body.product_description;
    }
    if (req.body.product_price) {
      offerToUpdate.product_price = req.body.product_price;
    }
    if (req.body.product_details) {
      offerToUpdate.product_details = JSON.parse(req.body.product_details);
    }
    if (req.files.picture) {
      const convertedFile = convertToBase64(req.files.picture);
      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertedFile,
        {
          folder: "/vinted/offers",
          public_id: offerToUpdate._id,
        }
      );
      offerToUpdate.product_image.secure_url = cloudinaryResponse.secure_url;
    }
    await offerToUpdate.save();
    return res.status(200).json(offerToUpdate);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.delete(
  "/offer/delete/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const offerToDelete = await Offer.findById(req.params.id);
      await cloudinary.uploader.destroy(offerToDelete.product_image.public_id);
      await offerToDelete.deleteOne();
      return res.status(200).json("Offer deleted");
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    let filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = { $lte: req.query.priceMax };
      }
    }
    let sort = {};
    if (req.query.sort === "price-desc") {
      sort.product_price = -1;
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1;
    }
    let page;
    if (req.query.page) {
      page = Number(req.query.page);
    } else {
      page = 1;
    }
    let limit;
    if (req.query.limit) {
      limit = Number(req.query.limit);
    } else {
      limit = 10;
    }
    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .select("product_name product_price -_id")
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);
    const count = await Offer.countDocuments(filters);
    return res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account",
    });
    return res.status(200).json(offer);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

module.exports = router;
