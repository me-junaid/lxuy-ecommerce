const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const uri = 'mongodb+srv://jdasjunaid_db_user:PXoq7YgZdQLdoNV5@lxuy.zau631m.mongodb.net/test?retryWrites=true&w=majority';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to test DB!');
    const db = mongoose.connection.db;
    
    // Hash our password "Password123!"
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    
    // 1. Update/upsert manager@lxuy.com
    await db.collection('users').updateOne(
      { email: 'manager@lxuy.com' },
      {
        $set: {
          name: 'Store Manager',
          firstName: 'Store',
          lastName: 'Manager',
          role: 'store_manager',
          password: hashedPassword,
          isEmailVerified: true,
          isActive: true
        }
      },
      { upsert: true }
    );
    console.log('Updated manager@lxuy.com password to Password123!');
    
    // 2. Update/upsert admin@lxuy.com
    await db.collection('users').updateOne(
      { email: 'admin@lxuy.com' },
      {
        $set: {
          name: 'Administrator',
          firstName: 'LXUY',
          lastName: 'Administrator',
          role: 'admin',
          password: hashedPassword,
          isEmailVerified: true,
          isActive: true
        }
      },
      { upsert: true }
    );
    console.log('Updated admin@lxuy.com password to Password123!');
    
  } catch (err) {
    console.error('Error updating passwords:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
