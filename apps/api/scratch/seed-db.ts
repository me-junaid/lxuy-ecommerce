import * as fs from "fs";
import * as path from "path";
import mongoose from "mongoose";

// Zero-dependency dotenv parser to read MONGODB_URI
const envPath = path.resolve(__dirname, "../../../.env");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/\\n/gm, "\n");
      }
      value = value.replace(/(^['"]|['"]$)/g, "");
      process.env[key] = value;
    }
  });
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("Error: MONGODB_URI is not defined in .env");
  process.exit(1);
}

// Schemas Definitions for standalone execution
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
    image: { type: String, trim: true },
  },
  { timestamps: true }
);

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const VariantAttributeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true, trim: true },
});

const ProductVariantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    attributes: [VariantAttributeSchema],
    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true },
    description: { type: String, required: true, trim: true },
    summary: { type: String, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    status: { type: String, required: true, enum: ["draft", "published", "archived"], default: "published" },
    images: [String],
    attributes: [VariantAttributeSchema],
    variants: [ProductVariantSchema],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const CategoryModel = mongoose.model("Category", CategorySchema);
const BrandModel = mongoose.model("Brand", BrandSchema);
const ProductModel = mongoose.model("Product", ProductSchema);

async function seed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri as string);
  console.log("Connected successfully.");

  // 1. Seed Categories
  const categoriesToSeed = [
    { name: "Men", slug: "men", description: "Men's fashion collection" },
    { name: "Women", slug: "women", description: "Women's fashion collection" },
    { name: "Accessories", slug: "accessories", description: "Luxury accessories" },
  ];

  const categoryMap: Record<string, any> = {};
  for (const cat of categoriesToSeed) {
    let doc = await CategoryModel.findOne({ slug: cat.slug });
    if (!doc) {
      doc = await CategoryModel.create(cat);
      console.log(`Created Category: ${cat.name}`);
    } else {
      console.log(`Category exists: ${cat.name}`);
    }
    categoryMap[cat.slug] = doc._id;
  }

  // 2. Seed Brands
  const brandsToSeed = [
    { name: "LXUY SIGNATURE", slug: "lxuy-signature", description: "LXUY main designer label" },
    { name: "POLO RALPH LAUREN", slug: "polo-ralph-lauren", description: "Polo Ralph Lauren brand label" },
    { name: "HACKETT LONDON", slug: "hackett-london", description: "Hackett London brand label" },
  ];

  const brandMap: Record<string, any> = {};
  for (const brand of brandsToSeed) {
    let doc = await BrandModel.findOne({ slug: brand.slug });
    if (!doc) {
      doc = await BrandModel.create(brand);
      console.log(`Created Brand: ${brand.name}`);
    } else {
      console.log(`Brand exists: ${brand.name}`);
    }
    brandMap[brand.slug] = doc._id;
  }

  // 3. Seed Products
  const productsToSeed = [
    {
      name: "Draped Silk Blouse",
      slug: "draped-silk-blouse",
      description: "An elegant draped silk blouse featuring a relaxed fit, fluid silhouette, and refined gold chain detailing at the waist. Perfect for editorial style.",
      summary: "Pure fluid silk editorial statement.",
      images: ["/images/models/modules1.jpeg", "/images/models/modules2.jpeg"],
      category: categoryMap["women"],
      brand: brandMap["lxuy-signature"],
      status: "published",
      ratings: { average: 4.8, count: 12 },
      variants: [
        {
          sku: "DSB-W-S-BEIGE",
          price: 450,
          compareAtPrice: 600,
          stock: 8,
          attributes: [{ name: "Size", value: "S" }, { name: "Color", value: "Beige" }],
          images: ["/images/models/modules1.jpeg"],
          isActive: true,
        },
        {
          sku: "DSB-W-M-BEIGE",
          price: 450,
          compareAtPrice: 600,
          stock: 12,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "Beige" }],
          images: ["/images/models/modules1.jpeg"],
          isActive: true,
        },
        {
          sku: "DSB-W-L-BEIGE",
          price: 450,
          compareAtPrice: 600,
          stock: 3,
          attributes: [{ name: "Size", value: "L" }, { name: "Color", value: "Beige" }],
          images: ["/images/models/modules1.jpeg"],
          isActive: true,
        },
      ],
    },
    {
      name: "Classic Wool Trench Coat",
      slug: "classic-wool-trench-coat",
      description: "A double-breasted trench coat tailored from ultra-soft structured merino wool. Designed with clean structural lines, waist tie, and premium storm flaps.",
      summary: "Structured winter wool overcoat.",
      images: ["/images/models/modules2.jpeg", "/images/models/modules3.jpeg"],
      category: categoryMap["women"],
      brand: brandMap["lxuy-signature"],
      status: "published",
      ratings: { average: 4.9, count: 8 },
      variants: [
        {
          sku: "CWC-W-S-OATMEAL",
          price: 890,
          compareAtPrice: 1100,
          stock: 5,
          attributes: [{ name: "Size", value: "S" }, { name: "Color", value: "Oatmeal" }],
          images: ["/images/models/modules2.jpeg"],
          isActive: true,
        },
        {
          sku: "CWC-W-M-OATMEAL",
          price: 890,
          compareAtPrice: 1100,
          stock: 7,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "Oatmeal" }],
          images: ["/images/models/modules2.jpeg"],
          isActive: true,
        },
      ],
    },
    {
      name: "Linen Wide-Leg Trouser",
      slug: "linen-wide-leg-trouser",
      description: "High-waisted, wide-leg trousers crafted from premium washed Belgian linen. Features pressed creases, side pockets, and a clean minimalist waistband.",
      summary: "Belgian linen wide trousers.",
      images: ["/images/models/modules3.jpeg", "/images/models/modules4.jpeg"],
      category: categoryMap["women"],
      brand: brandMap["lxuy-signature"],
      status: "published",
      ratings: { average: 4.5, count: 15 },
      variants: [
        {
          sku: "LWT-W-S-WHITE",
          price: 320,
          compareAtPrice: 400,
          stock: 15,
          attributes: [{ name: "Size", value: "S" }, { name: "Color", value: "White" }],
          images: ["/images/models/modules3.jpeg"],
          isActive: true,
        },
        {
          sku: "LWT-W-M-WHITE",
          price: 320,
          compareAtPrice: 400,
          stock: 20,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "White" }],
          images: ["/images/models/modules3.jpeg"],
          isActive: true,
        },
      ],
    },
    {
      name: "Ribbed Merino Knit Dress",
      slug: "ribbed-merino-knit-dress",
      description: "A form-fitting midi dress knit from lightweight, high-twist merino wool. Designed with a subtle crewneck, long sleeves, and a sleek ribbed texture.",
      summary: "Form-fitting ribbed merino wool dress.",
      images: ["/images/models/modules4.jpeg", "/images/models/modules1.jpeg"],
      category: categoryMap["women"],
      brand: brandMap["lxuy-signature"],
      status: "published",
      ratings: { average: 4.7, count: 9 },
      variants: [
        {
          sku: "RMK-W-XS-BLACK",
          price: 520,
          compareAtPrice: 700,
          stock: 4,
          attributes: [{ name: "Size", value: "XS" }, { name: "Color", value: "Black" }],
          images: ["/images/models/modules4.jpeg"],
          isActive: true,
        },
        {
          sku: "RMK-W-S-BLACK",
          price: 520,
          compareAtPrice: 700,
          stock: 10,
          attributes: [{ name: "Size", value: "S" }, { name: "Color", value: "Black" }],
          images: ["/images/models/modules4.jpeg"],
          isActive: true,
        },
        {
          sku: "RMK-W-M-BLACK",
          price: 520,
          compareAtPrice: 700,
          stock: 12,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "Black" }],
          images: ["/images/models/modules4.jpeg"],
          isActive: true,
        },
      ],
    },
    // Men's recommendations / collections
    {
      name: "Classic Beige Linen Suit",
      slug: "classic-beige-linen-suit",
      description: "An elegant, lightweight linen suit tailored for premium warm-weather comfort and editorial casual-formal styling.",
      summary: "Warm-weather linen suit tailoring.",
      images: ["/images/models/modules5.jpeg", "/images/models/modules6.jpeg"],
      category: categoryMap["men"],
      brand: brandMap["polo-ralph-lauren"],
      status: "published",
      ratings: { average: 4.6, count: 5 },
      variants: [
        {
          sku: "CBLS-M-S-BEIGE",
          price: 18900,
          compareAtPrice: 27000,
          stock: 3,
          attributes: [{ name: "Size", value: "S" }, { name: "Color", value: "Beige" }],
          images: ["/images/models/modules5.jpeg"],
          isActive: true,
        },
        {
          sku: "CBLS-M-M-BEIGE",
          price: 18900,
          compareAtPrice: 27000,
          stock: 4,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "Beige" }],
          images: ["/images/models/modules5.jpeg"],
          isActive: true,
        },
      ],
    },
    {
      name: "Navy Solid Classic Fit Short Sleeve Polo",
      slug: "navy-solid-classic-fit-short-sleeve-polo",
      description: "A classic fit polo crafted from premium piqué cotton, detailing structural collar ribs and authentic buttons.",
      summary: "Hackett London short sleeve polo.",
      images: ["/images/models/modules6.jpeg", "/images/models/modules7.jpeg"],
      category: categoryMap["men"],
      brand: brandMap["hackett-london"],
      status: "published",
      ratings: { average: 4.4, count: 20 },
      variants: [
        {
          sku: "NSCFP-M-M-NAVY",
          price: 9600,
          compareAtPrice: 16000,
          stock: 15,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "Navy" }],
          images: ["/images/models/modules6.jpeg"],
          isActive: true,
        },
      ],
    },
    {
      name: "Sand Linen Casual Jacket",
      slug: "sand-linen-casual-jacket",
      description: "A lightweight unstructured blazer jacket woven in Italian sand-colored linen, ideal for unbuttoned layering.",
      summary: "Polo Ralph Lauren linen blazer.",
      images: ["/images/models/modules7.jpeg", "/images/models/modules8.jpeg"],
      category: categoryMap["men"],
      brand: brandMap["polo-ralph-lauren"],
      status: "published",
      ratings: { average: 4.7, count: 14 },
      variants: [
        {
          sku: "SLCJ-M-M-SAND",
          price: 14400,
          compareAtPrice: 24000,
          stock: 6,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "Sand" }],
          images: ["/images/models/modules7.jpeg"],
          isActive: true,
        },
      ],
    },
    {
      name: "Tan Double-Breasted Editorial Suit",
      slug: "tan-double-breasted-editorial-suit",
      description: "A double-breasted suit tailored in pure structured linen-cotton, offering sharp peak lapels and a vintage tan tone.",
      summary: "Tan double-breasted formal suit.",
      images: ["/images/models/modules8.jpeg", "/images/models/modules9.jpeg"],
      category: categoryMap["men"],
      brand: brandMap["polo-ralph-lauren"],
      status: "published",
      ratings: { average: 4.9, count: 6 },
      variants: [
        {
          sku: "TDBES-M-M-TAN",
          price: 23400,
          compareAtPrice: 39000,
          stock: 2,
          attributes: [{ name: "Size", value: "M" }, { name: "Color", value: "Tan" }],
          images: ["/images/models/modules8.jpeg"],
          isActive: true,
        },
      ],
    },
  ];

  for (const prod of productsToSeed) {
    let doc = await ProductModel.findOne({ slug: prod.slug });
    if (doc) {
      // Delete existing to update fresh
      await ProductModel.deleteOne({ _id: doc._id });
      console.log(`Deleted existing product to refresh: ${prod.name}`);
    }
    await ProductModel.create(prod);
    console.log(`Seeded Product: ${prod.name}`);
  }

  console.log("Database successfully seeded with dummy products!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  mongoose.disconnect();
});
