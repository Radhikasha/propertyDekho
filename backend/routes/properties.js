const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');

// Middleware to extract user from token
const extractUser = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      req.user = decoded;
    } catch (err) {
      console.log('Invalid token:', err.message);
    }
  }
  next();
};

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().populate('owner', 'name email');
    console.log('Fetched properties:', properties.length);
    res.json(properties);
  } catch (err) {
    console.error('Error fetching all properties:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get properties by owner (user's listings)
router.get('/my-listings', requireAuth, async (req, res) => {
  try {
    console.log('Fetching listings for user:', req.user.id);
    
    // First, try to get properties with owner field
    let properties = await Property.find({ owner: req.user.id }).populate('owner', 'name email');
    
    console.log('Found properties with owner:', properties.length);
    
    // If no properties found with owner field, this might be because existing properties don't have owner field
    // For development/migration purposes, you might want to handle this case
    if (properties.length === 0) {
      console.log('No properties found with owner field. This might be normal for new users or during migration.');
    }
    
    res.json(properties);
  } catch (err) {
    console.error('Error fetching user properties:', err);
    res.status(500).json({ 
      message: 'Failed to fetch your listings',
      error: err.message 
    });
  }
});

// Temporary migration route to assign ownership to properties without owners
router.post('/assign-ownership', requireAuth, async (req, res) => {
  try {
    console.log('Assigning ownership for user:', req.user.id);
    
    // Find properties without owners
    const propertiesWithoutOwner = await Property.find({ 
      $or: [
        { owner: { $exists: false } },
        { owner: null }
      ]
    });
    
    console.log('Found properties without owner:', propertiesWithoutOwner.length);
    
    // Assign current user as owner to properties without owners
    const updateResult = await Property.updateMany(
      { 
        $or: [
          { owner: { $exists: false } },
          { owner: null }
        ]
      },
      { $set: { owner: req.user.id } }
    );
    
    console.log('Updated properties:', updateResult.modifiedCount);
    
    res.json({ 
      message: `Assigned ownership of ${updateResult.modifiedCount} properties to you`,
      modifiedCount: updateResult.modifiedCount
    });
  } catch (err) {
    console.error('Error assigning ownership:', err);
    res.status(500).json({ 
      message: 'Failed to assign ownership',
      error: err.message 
    });
  }
});

// Get single property
router.get('/:id', getProperty, (req, res) => {
  res.json(res.property);
});

// Create property
router.post('/', requireAuth, async (req, res) => {
  console.log('Received property data:', req.body);
  console.log('User from token:', req.user);
  
  try {
    // Basic validation
    if (!req.body.title || !req.body.location) {
      return res.status(400).json({ message: 'Title and location are required' });
    }
    
    // Validate coordinates format if provided
    if (req.body.coordinates) {
      const coords = req.body.coordinates.split(',').map(coord => parseFloat(coord.trim()));
      if (coords.length !== 2 || coords.some(isNaN)) {
        return res.status(400).json({ 
          message: 'Invalid coordinates format. Use: latitude,longitude (e.g., 20.5937,78.9629)' 
        });
      }
    }
    
    const property = new Property({
      title: req.body.title,
      image: req.body.image || '',
      location: req.body.location,
      description: req.body.description || '',
      coordinates: req.body.coordinates || '20.5937, 78.9629',
      size: parseFloat(req.body.size) || 0,
      price: parseFloat(req.body.price) || 0,
      type: req.body.type || 'Plot',
      status: req.body.status || 'Available',
      owner: req.user.id // Set the owner to the authenticated user
    });
    
    console.log('Creating property:', property);
    const newProperty = await property.save();
    console.log('Property created successfully:', newProperty);
    
    res.status(201).json(newProperty);
  } catch (err) {
    console.error('Error creating property:', err);
    res.status(400).json({ 
      message: 'Failed to create property',
      error: err.message 
    });
  }
});

// Update property
router.patch('/:id', requireAuth, getProperty, async (req, res) => {
  try {
    // Check if user owns this property (allow update if no owner is set - for legacy properties)
    if (res.property.owner && res.property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    // Log the incoming request body for debugging
    console.log('Update request body:', req.body);
    console.log('Property owner:', res.property.owner);
    console.log('Current user:', req.user.id);
    
    // Get the property to update
    const property = res.property;
    
    // If property doesn't have an owner, assign current user as owner
    if (!property.owner) {
      property.owner = req.user.id;
      console.log('Assigning owner to legacy property:', req.user.id);
    }
    
    // List of allowed fields that can be updated
    const allowedUpdates = [
      'title', 'description', 'location', 'size', 'price', 
      'type', 'status', 'image', 'coordinates'
    ];
    
    // Update only the fields that are present in the request body
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        property[field] = field === 'size' || field === 'price' 
          ? parseFloat(req.body[field]) || 0 
          : req.body[field];
      }
    });
    
    // Save the updated property
    const updatedProperty = await property.save();
    console.log('Property updated successfully:', updatedProperty);
    
    res.json(updatedProperty);
  } catch (err) {
    console.error('Error updating property:', err);
    res.status(400).json({ 
      message: 'Failed to update property',
      error: err.message 
    });
  }
});

// Delete property
router.delete('/:id', requireAuth, getProperty, async (req, res) => {
  try {
    // Check if user owns this property (allow deletion if no owner is set - for legacy properties)
    if (res.property.owner && res.property.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    console.log('Deleting property:', req.params.id);
    console.log('Property owner:', res.property.owner);
    console.log('Current user:', req.user.id);

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    console.error('Error deleting property:', err);
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get property by ID
async function getProperty(req, res, next) {
  let property;
  try {
    property = await Property.findById(req.params.id);
    if (property == null) {
      return res.status(404).json({ message: 'Cannot find property' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.property = property;
  next();
}

module.exports = router;
