import React from 'react';
import { Card, CardContent, Typography, Box, Icon } from '@mui/material';

export const KPICard = ({ titulo, valor, etiqueta, unidad, icon, color = '#334155', loading }) => (
  <Card
    elevation={0}
    sx={{
      height: '100%',
      border: '1px solid #E2E8F0',
      borderRadius: '12px',
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon component={icon} sx={{ fontSize: 28, color, mr: 2 }} />
        <Typography variant="h4" component="div" fontWeight="600" color="#0F172A">
          {loading 
            ? '...' 
            : unidad === 'currency' 
              ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(valor) 
              : valor}
          {loading ? '' : (unidad === '%' ? '%' : '')}
        </Typography>
      </Box>
      <Typography variant="body2" color="#64748B" sx={{ pl: '44px' }}>
        {etiqueta}
      </Typography>
    </CardContent>
  </Card>
);
