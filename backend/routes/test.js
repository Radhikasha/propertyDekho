const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Test route
router.get('/test', async (req, res) => {
  try {
    // Try to fetch some data from MongoDB
    const users = await User.find({}).limit(5);
    res.json({ 
      success: true, 
      message: 'API is working!',
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching data',
      error: error.message 
    });
  }
});

module.exports = router;
