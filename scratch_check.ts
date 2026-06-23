import { connectDB } from './server/config/db.js';
import { User } from './server/models/User.js';

async function check() {
  await connectDB();
  const allUsers = await User.find({}, { email: 1 });
  console.log('All user emails:', allUsers.map(u => u.email));
  process.exit(0);
}

check().catch(console.error);
