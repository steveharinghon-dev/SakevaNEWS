import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  const shapes = [
    { size: 300, x: '10%', y: '20%', duration: 20, delay: 0, rotate: 360 },
    { size: 200, x: '80%', y: '10%', duration: 25, delay: 2, rotate: -360 },
    { size: 150, x: '70%', y: '70%', duration: 30, delay: 5, rotate: 360 },
    { size: 250, x: '15%', y: '80%', duration: 22, delay: 3, rotate: -360 },
    { size: 180, x: '50%', y: '50%', duration: 28, delay: 1, rotate: 360 },
    { size: 120, x: '85%', y: '45%', duration: 26, delay: 4, rotate: -360 },
    { size: 220, x: '25%', y: '15%', duration: 24, delay: 6, rotate: 360 },
    { size: 160, x: '60%', y: '85%', duration: 27, delay: 2, rotate: -360 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-gradient-to-br from-sakeva-pink/10 to-pink-400/5"
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 60, 0],
            rotate: [0, shape.rotate / 2, shape.rotate],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Дополнительные квадратные фигуры */}
      <motion.div
        className="absolute w-40 h-40 border-4 border-sakeva-pink/20 rounded-lg"
        style={{ 
          left: '40%', 
          top: '30%',
          filter: 'blur(2px)',
        }}
        animate={{
          rotate: [0, 360],
          x: [0, 30, -30, 0],
          y: [0, -30, 30, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      <motion.div
        className="absolute w-32 h-32 border-4 border-pink-300/20 rounded-lg"
        style={{ 
          left: '75%', 
          top: '60%',
          filter: 'blur(2px)',
        }}
        animate={{
          rotate: [360, 0],
          x: [0, -40, 40, 0],
          y: [0, 40, -40, 0],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Треугольники через CSS */}
      <motion.div
        className="absolute"
        style={{
          left: '20%',
          top: '60%',
          width: 0,
          height: 0,
          borderLeft: '60px solid transparent',
          borderRight: '60px solid transparent',
          borderBottom: '100px solid rgba(255, 107, 157, 0.15)',
          filter: 'blur(4px) drop-shadow(0 0 30px rgba(255, 107, 157, 0.4))',
        }}
        animate={{
          rotate: [0, 360],
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute"
        style={{
          left: '65%',
          top: '25%',
          width: 0,
          height: 0,
          borderLeft: '50px solid transparent',
          borderRight: '50px solid transparent',
          borderBottom: '80px solid rgba(255, 107, 157, 0.15)',
          filter: 'blur(4px) drop-shadow(0 0 30px rgba(255, 107, 157, 0.4))',
        }}
        animate={{
          rotate: [360, 0],
          x: [0, -30, 30, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
