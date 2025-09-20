import React from 'react';
import { motion } from 'framer-motion';
import houseImage from '../assets/house-3d.png'; // We'll need to add this image

const House3D = () => {
  return (
    <div className="house3d-container">
      <motion.div
        className="house3d"
        animate={{
          rotateY: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <img 
          src={houseImage} 
          alt="3D House" 
          className="house-image"
        />
      </motion.div>
    </div>
  );
};

export default House3D;
