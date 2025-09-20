const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true,
  logger: true
});

// Handle property enquiry
router.post('/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { name, email, phone, message, isPurchase = false } = req.body;

    console.log('Received enquiry:', { propertyId, name, email, isPurchase });

    // Get property and owner details with populated owner
    const property = await Property.findById(propertyId).populate('owner');
    
    if (!property) {
      console.error('Property not found:', propertyId);
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.owner || !property.owner.email) {
      console.error('Property owner email not found for property:', propertyId);
      return res.status(400).json({ message: 'Property owner email not found' });
    }

    // If this is a purchase request
    if (isPurchase) {
      // Get buyer details (assuming user is logged in and their ID is in the request)
      const buyer = await User.findById(req.userId);
      if (!buyer) {
        return res.status(400).json({ message: 'Buyer information not found' });
      }

      // Create transaction record
      const transaction = new Transaction({
        property: property._id,
        buyer: buyer._id,
        seller: property.owner._id,
        amount: property.price,
        status: 'pending',
        paymentDetails: {}
      });

      await transaction.save();

      // Update property status
      property.status = 'Under Negotiation';
      await property.save();

      // Send purchase confirmation email to buyer
      const buyerMailOptions = {
        from: `"PropertyDeal" <${process.env.EMAIL_USER}>`,
        to: buyer.email,
        subject: `Purchase Request Confirmation - ${property.title}`,
        html: `
          <h2>Purchase Request Confirmation</h2>
          <p>Thank you for your interest in purchasing the property:</p>
          
          <h3>Property Details:</h3>
          <p><strong>Title:</strong> ${property.title}</p>
          <p><strong>Location:</strong> ${property.location}</p>
          <p><strong>Price:</strong> ₹${property.price?.toLocaleString()}</p>
          <p><strong>Transaction ID:</strong> ${transaction._id}</p>
          
          <h3>Seller's Contact Information:</h3>
          <p><strong>Name:</strong> ${property.owner.name}</p>
          <p><strong>Email:</strong> ${property.owner.email}</p>
          <p><strong>Phone:</strong> ${property.owner.phone || 'Not provided'}</p>
          
          <p>Please contact the seller directly to proceed with the purchase.</p>
          <p>---</p>
          <p>This is an automated message from PropertyDeal.</p>
        `
      };

      // Send notification to seller
      const sellerMailOptions = {
        from: `"PropertyDeal" <${process.env.EMAIL_USER}>`,
        to: property.owner.email,
        subject: `New Purchase Request - ${property.title}`,
        html: `
          <h2>New Purchase Request</h2>
          <p>You have received a purchase request for your property:</p>
          
          <h3>Property Details:</h3>
          <p><strong>Title:</strong> ${property.title}</p>
          <p><strong>Location:</strong> ${property.location}</p>
          <p><strong>Price:</strong> ₹${property.price?.toLocaleString()}</p>
          
          <h3>Buyer's Information:</h3>
          <p><strong>Name:</strong> ${buyer.name}</p>
          <p><strong>Email:</strong> ${buyer.email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Message:</strong> ${message || 'No additional message'}</p>
          
          <p>Please contact the buyer to proceed with the sale.</p>
          <p>---</p>
          <p>This is an automated message from PropertyDeal.</p>
        `
      };

      await Promise.all([
        transporter.sendMail(buyerMailOptions),
        transporter.sendMail(sellerMailOptions)
      ]);

      return res.json({ 
        message: 'Purchase request sent successfully',
        transactionId: transaction._id
      });
    }

    // Original enquiry flow
    console.log('Sending enquiry email to owner:', property.owner.email);

    const enquiryMailOptions = {
      from: `"${name} (via PropertyDeal)" <${process.env.EMAIL_USER}>`,
      to: property.owner.email,
      replyTo: email,
      subject: `New Enquiry for ${property.title}`,
      html: `
        <h2>New Property Enquiry</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Phone:</strong> ${phone}</p>
        
        <h3>Property Details:</h3>
        <p><strong>Title:</strong> ${property.title}</p>
        <p><strong>Location:</strong> ${property.location}</p>
        <p><strong>Price:</strong> ₹${property.price?.toLocaleString()}</p>
        <p><strong>Reference ID:</strong> ${property._id}</p>
        
        <h3>Message:</h3>
        <p>${message}</p>
        
        <p>---</p>
        <p>This enquiry was sent through PropertyDeal. Please reply directly to ${name} using the email above.</p>
      `
    };

    await transporter.sendMail(enquiryMailOptions);
    console.log('Enquiry email sent successfully');
    
    res.json({ message: 'Enquiry sent successfully' });
  } catch (error) {
    console.error('Error processing request:', {
      message: error.message,
      stack: error.stack,
      env: {
        emailUser: process.env.EMAIL_USER ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    });
    res.status(500).json({ 
      message: 'Failed to process request', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;