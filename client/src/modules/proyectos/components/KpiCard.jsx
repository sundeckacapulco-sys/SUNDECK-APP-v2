import React, { useState, useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import {
  GridView as GridIcon,
  Straighten as RulerIcon,
  AttachMoney as DollarSignIcon,
  AccessTime as ClockIcon
} from '@mui/icons-material';

const KpiCard = ({ icon, label, value, tooltip, color = '#2196f3', animate = false }) => {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);

  // Animación de conteo incremental
  useEffect(() => {
    if (!animate || typeof value !== 'number') {
      setDisplayValue(value);
      return;
    }

    const duration = 800; // ms
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animate]);

  // Seleccionar ícono
  const getIcon = () => {
    const iconProps = { sx: { fontSize: 32, color, mb: 1 } };
    
    switch (icon) {
      case 'Grid':
        return <GridIcon {...iconProps} />;
      case 'Ruler':
        return <RulerIcon {...iconProps} />;
      case 'DollarSign':
        return <DollarSignIcon {...iconProps} />;
      case 'Clock':
        return <ClockIcon {...iconProps} />;
      default:
        return <GridIcon {...iconProps} />;
    }
  };

  return (
    <Tooltip title={tooltip || ''} arrow placement="top">
      <Box
        sx={{
          bgcolor: 'white',
          borderRadius: '12px',
          p: 2.5,
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(226, 232, 240, 1)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
            borderColor: color,
          }
        }}
      >
        {getIcon()}
        
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            color: 'rgba(30, 41, 59, 1)', // slate-800
            mb: 0.5,
            transition: 'all 0.3s ease'
          }}
        >
          {displayValue}
        </Typography>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(100, 116, 139, 1)', // slate-500
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontSize: '0.7rem'
          }}
        >
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default KpiCard;
