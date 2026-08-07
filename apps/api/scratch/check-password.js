const bcrypt = require('bcrypt');

const hash = '$2b$12$jImVmTcXFSJ3wETGne0dle6nuVVPvaxYsqZP8fnVTrSSifSSIHHuS';

const candidates = [
  'admin123',
  'Admin123!',
  'manager123',
  'Manager123!',
  'password',
  'Password123!',
  'Password123',
  'admin1234',
  'admin',
  'manager',
  'store_manager',
  'manager@123',
  'manager@lxuy',
  'manager@lxuy.com',
  '12345678',
  'adminadmin',
  'Admin@123',
  'Manager@123',
  'adminPassword',
  'lxuyAdmin123',
  'lxuyManager123'
];

async function check() {
  console.log('Testing candidates...');
  for (const cand of candidates) {
    const isMatch = await bcrypt.compare(cand, hash);
    if (isMatch) {
      console.log(`FOUND! Password is: ${cand}`);
      return;
    }
  }
  console.log('No candidate matched.');
}

check();
