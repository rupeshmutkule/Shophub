import 'dotenv/config';
import mongoose from 'mongoose';
import fetch from 'node-fetch';

const MONGO_URI = process.env.MONGO_URI;

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  rating: Number,
  photo: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

async function seedProducts() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing products
    const count = await Product.countDocuments();
    console.log(`📊 Current products in database: ${count}`);

    if (count >= 25) {
      console.log('⚠️  Database already has 25+ products. Skipping seed.');
      console.log('💡 To re-seed, delete products first or use a different limit.');
      process.exit(0);
    }

    console.log('🌐 Fetching products from FakeStore API...');
    const response = await fetch('https://fakestoreapi.com/products?limit=25');
    
    if (!response.ok) {
      throw new Error(`FakeStore API returned ${response.status}: ${response.statusText}`);
    }

    const externalProducts = await response.json();
    console.log(`✅ Fetched ${externalProducts.length} products from API`);

    // Format products
    const formattedProducts = externalProducts.map(p => ({
      name: p.title,
      price: p.price,
      rating: p.rating?.rate || 0,
      photo: p.image,
      description: p.description,
    }));

    console.log('💾 Inserting products into database...');
    const result = await Product.insertMany(formattedProducts);
    console.log(`✅ Successfully inserted ${result.length} products!`);

    // Show sample product
    console.log('\n📦 Sample product:');
    console.log(`   Name: ${result[0].name}`);
    console.log(`   Price: $${result[0].price}`);
    console.log(`   Rating: ${result[0].rating}`);

    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Total products now: ${await Product.countDocuments()}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check internet connection');
    console.error('   2. Verify MongoDB connection');
    console.error('   3. Check FakeStore API status: https://fakestoreapi.com/products');
    console.error('   4. Verify .env file has correct MONGO_URI');
    process.exit(1);
  }
}

seedProducts();
