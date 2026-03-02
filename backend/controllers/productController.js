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
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (err) {
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
