import React, { useState, useEffect } from 'react';
import '../../styles/responsive.css';

const ResponsiveLayout = ({ children }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const getDeviceSize = () => {
    if (windowWidth < 576) return 'xs';
    if (windowWidth < 768) return 'sm';
    if (windowWidth < 992) return 'md';
    if (windowWidth < 1200) return 'lg';
    return 'xl';
  };
  
  return (
    <div className="responsive-layout">
      <div className="container">
        {React.Children.map(children, child => {
          // Pass device size to all children components
          return React.cloneElement(child, { deviceSize: getDeviceSize() });
        })}
      </div>
    </div>
  );
};

export default ResponsiveLayout;
