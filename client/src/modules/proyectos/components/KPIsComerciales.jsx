import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
  Percent as PercentIcon
} from '@mui/icons-material';

const KPIsComerciales = ({ kpis, loading }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const kpiCards = [
    {
      title: 'Total Registros',
      value: kpis.total,
      icon: <AssignmentIcon />,
      color: '#757575',
      bgColor: '#f5f5f5'
    },
    {
      title: 'Prospectos',
      value: kpis.prospectos,
      icon: <PeopleIcon />,
      color: '#2196f3',
      bgColor: '#e3f2fd',
      subtitle: '🔵 Activos'
    },
    {
      title: 'Proyectos',
      value: kpis.proyectos,
      icon: <TrendingUpIcon />,
      color: '#4caf50',
      bgColor: '#e8f5e9',
      subtitle: '🟢 En Proceso'
    },
    {
      title: 'Tasa Conversión',
      value: `${kpis.tasaConversion}%`,
      icon: <PercentIcon />,
      color: '#ff9800',
      bgColor: '#fff3e0',
      subtitle: 'Prospecto → Proyecto'
    },
    {
      title: 'Valor Total',
      value: formatCurrency(kpis.valorTotal),
      icon: <MoneyIcon />,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
      subtitle: 'Monto Estimado'
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(kpis.promedioTicket),
      icon: <ChartIcon />,
      color: '#00bcd4',
      bgColor: '#e0f7fa',
      subtitle: 'Por Registro'
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {kpiCards.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={2} key={index}>
          <Card 
            elevation={2}
            sx={{ 
              bgcolor: kpi.bgColor,
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box 
                  sx={{ 
                    color: kpi.color,
                    display: 'flex',
                    alignItems: 'center',
                    mr: 1
                  }}
                >
                  {kpi.icon}
                </Box>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {kpi.title}
                </Typography>
              </Box>
              
              {loading ? (
                <Skeleton variant="text" width="80%" height={40} />
              ) : (
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: kpi.color,
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    mb: 0.5
                  }}
                >
                  {kpi.value}
                </Typography>
              )}
              
              {kpi.subtitle && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontSize: '0.65rem' }}
                >
                  {kpi.subtitle}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default KPIsComerciales;
