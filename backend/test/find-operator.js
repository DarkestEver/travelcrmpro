const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');

const findOperator = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const operators = await User.find({ role: 'operator' }).select('email name role');
  console.log('Operators found:', operators);
  mongoose.connection.close();
};

findOperator();
