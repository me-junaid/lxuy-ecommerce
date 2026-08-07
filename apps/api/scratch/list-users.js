const mongoose = require('mongoose');

const uri = 'mongodb+srv://jdasjunaid_db_user:PXoq7YgZdQLdoNV5@lxuy.zau631m.mongodb.net/test?retryWrites=true&w=majority';

const CategorySchema = new mongoose.Schema({ name: String });
const BrandSchema = new mongoose.Schema({ name: String });
mongoose.model('Category', CategorySchema);
mongoose.model('Brand', BrandSchema);

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  status: { type: String, required: true },
  images: { type: [String], required: true, default: [] },
  variants: [new mongoose.Schema({
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    attributes: [new mongoose.Schema({ name: String, value: String }, { _id: false })],
    images: [String],
    isActive: { type: Boolean, default: true }
  })]
}, { timestamps: true });

const ProductModel = mongoose.model('Product', ProductSchema);

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to test DB!');
    
    const p = await ProductModel.findOne({ name: 'Lxuy Men Shirt' })
      .populate('category')
      .populate('brand')
      .exec();
      
    if (p) {
      console.log('Found product:', p.name);
      console.log('Original status:', p.status);
      
      const updateProductDto = { status: 'draft' }; // Reset back to draft
      
      console.log('Running Object.assign with updateProductDto...');
      Object.assign(p, {
        ...updateProductDto,
        category: updateProductDto.category ? new mongoose.Types.ObjectId(updateProductDto.category) : p.category,
        brand: updateProductDto.brand ? new mongoose.Types.ObjectId(updateProductDto.brand) : p.brand,
      });
      
      console.log('Attempting to save...');
      await p.save();
      console.log('Saved successfully!');
    } else {
      console.log('No product named Lxuy Men Shirt found.');
    }
  } catch (err) {
    console.error('Save failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
