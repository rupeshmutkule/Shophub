import Product from '../models/Product.js';
import fetch from 'node-fetch';

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    console.log('\n=== GET PRODUCTS BY CATEGORY ===');
    console.log('📂 Category requested:', category);
    
    const products = await Product.find({ 
      category: category.toLowerCase() 
    });
    
    console.log(`✅ Found ${products.length} products in category "${category}"`);
    console.log('==========================\n');
    
    res.json(products);
  } catch (err) {
    console.error('❌ Category filter error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    console.log('\n=== CREATE PRODUCT DEBUG ===');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📂 Category received:', req.body.category);
    
    const newProduct = new Product(req.body);
    await newProduct.save();
    
    console.log('✅ Product saved successfully!');
    console.log('   - Product ID:', newProduct._id);
    console.log('   - Name:', newProduct.name);
    console.log('   - Category:', newProduct.category);
    console.log('   - Price:', newProduct.price);
    console.log('==========================\n');
    
    res.json(newProduct);
  } catch (err) {
    console.error('❌ Product creation error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    console.log('\n=== UPDATE PRODUCT DEBUG ===');
    console.log('📝 Product ID:', req.params.id);
    console.log('📦 Update data:', JSON.stringify(req.body, null, 2));
    
    // Find the existing product first
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      console.log('❌ Product not found');
      return res.status(404).json({ error: 'Product not found' });
    }
    
    console.log('📸 Existing images:', existingProduct.images);
    console.log('📸 New images:', req.body.images);
    
    // Update the product with new data
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    console.log('✅ Product updated successfully!');
    console.log('   - Product ID:', updatedProduct._id);
    console.log('   - Name:', updatedProduct.name);
    console.log('   - Category:', updatedProduct.category);
    console.log('   - Photo:', updatedProduct.photo);
    console.log('   - Images:', updatedProduct.images);
    console.log('==========================\n');
    
    res.json(updatedProduct);
  } catch (err) {
    console.error('❌ Product update error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const seedProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    console.log(`📊 Current products: ${count}`);
    
    if (count >= 25) {
      return res.json({ 
        message: 'Database already seeded (>=25 products).', 
        count: count 
      });
    }

    console.log('🌐 Fetching from FakeStore API...');
    const response = await fetch('https://fakestoreapi.com/products?limit=25');
    
    if (!response.ok) {
      throw new Error(`FakeStore API error: ${response.status} ${response.statusText}`);
    }

    const externalProducts = await response.json();
    console.log(`✅ Fetched ${externalProducts.length} products`);

    if (!externalProducts || externalProducts.length === 0) {
      throw new Error('No products received from FakeStore API');
    }

    const formattedProducts = externalProducts.map(p => ({
      name: p.title,
      price: p.price,
      rating: p.rating?.rate || 0,
      photo: p.image,
      description: p.description,
    }));

    const result = await Product.insertMany(formattedProducts);
    console.log(`✅ Inserted ${result.length} products`);
    
    res.json({ 
      message: 'Database seeded successfully with 25 products!',
      count: result.length,
      sample: {
        name: result[0].name,
        price: result[0].price
      }
    });
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    res.status(500).json({ 
      error: err.message,
      hint: 'Check internet connection and FakeStore API status'
    });
  }
};
