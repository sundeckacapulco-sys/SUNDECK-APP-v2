import { useMemo } from 'react';
import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
  Percent as PercentIcon,
  AccessTime as AccessTimeIcon,
  Forum as ForumIcon,
  Diversity3 as DiversityIcon
} from '@mui/icons-material';

const KPIsComerciales = ({ kpis, loading }) => {
  const resumen = kpis?.resumen || {};
  const humanos = kpis?.humanos || {};

  const formatCurrency = value => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value ?? 0);

  const formatNumber = value => new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value ?? 0);

  const cards = useMemo(() => ([
    {
      key: 'total',
      title: 'Total registros',
      value: formatNumber(resumen.total),
      icon: <AssignmentIcon fontSize="small" />, 
      color: '#0F172A',
      bgColor: '#E2E8F0',
      subtitle: 'Prospectos + proyectos'
    },
    {
      key: 'prospectos',
      title: 'Prospectos activos',
      value: formatNumber(resumen.prospectos),
      icon: <PeopleIcon fontSize="small" />, 
      color: '#14B8A6',
      bgColor: '#D1FAE5',
      subtitle: 'Seguimiento comercial'
    },
    {
      key: 'proyectos',
      title: 'Proyectos en curso',
      value: formatNumber(resumen.proyectos),
      icon: <TrendingUpIcon fontSize="small" />, 
      color: '#0F172A',
      bgColor: '#F1F5F9',
      subtitle: 'Etapas operativas'
    },
    {
      key: 'conversion',
      title: 'Tasa de conversión',
      value: `${resumen.tasaConversion ?? 0}%`,
      icon: <PercentIcon fontSize="small" />, 
      color: '#D97706',
      bgColor: '#FEF3C7',
      subtitle: 'Prospecto → Proyecto'
    },
    {
      key: 'valorTotal',
      title: 'Valor total estimado',
      value: formatCurrency(resumen.valorTotal),
      icon: <MoneyIcon fontSize="small" />, 
      color: '#7C3AED',
      bgColor: '#EDE9FE',
      subtitle: 'Ingresos proyectados'
    },
    {
      key: 'ticket',
      title: 'Ticket promedio',
      value: formatCurrency(resumen.promedioTicket),
      icon: <ChartIcon fontSize="small" />, 
      color: '#0F172A',
      bgColor: '#E0F2FE',
      subtitle: 'Por registro'
    },
    {
      key: 'tiempoCierre',
      title: 'Tiempo promedio de cierre',
      value: `${humanos.tiempoPromedioCierre ?? 0} días`,
      icon: <AccessTimeIcon fontSize="small" />, 
      color: '#0F172A',
      bgColor: '#F8FAFC',
      subtitle: 'Creación → conversión'
    },
    {
      key: 'tasaRespuesta',
      title: 'Tasa de respuesta',
      value: `${humanos.tasaRespuesta ?? 0}%`,
      icon: <ForumIcon fontSize="small" />, 
      color: '#14B8A6',
      bgColor: '#CCFBF1',
      subtitle: 'Prospectos con notas'
    },
    {
      key: 'referidos',
      title: 'Referidos activos',
      value: formatNumber(humanos.referidosActivos),
      icon: <DiversityIcon fontSize="small" />, 
      color: '#D4AF37',
      bgColor: '#FDF6B2',
      subtitle: 'Canal recomendados'
    }
  ]), [resumen, humanos]);

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {cards.map(card => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={card.key}>
          <Card
            elevation={0}
            sx={{
              bgcolor: card.bgColor,
              borderRadius: 3,
              border: '1px solid rgba(15, 23, 42, 0.04)',
              height: '100%',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              boxShadow: '0 14px 32px rgba(15, 23, 42, 0.08)',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)'
              }
            }}
          >
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Box
                  sx={{
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(15, 23, 42, 0.05)',
                    borderRadius: '999px',
                    width: 36,
                    height: 36,
                    mr: 1.5
                  }}
                >
                  {card.icon}
                </Box>
                <Typography
                  variant="overline"
                  sx={{
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em'
                  }}
                >
                  {card.title}
                </Typography>
              </Box>

              {loading ? (
                <Skeleton variant="text" width="70%" height={42} />
              ) : (
                <Typography
                  variant="h4"
                  sx={{
                    color: card.color,
                    fontWeight: 700,
                    fontFamily: 'Playfair Display, serif',
                    fontSize: { xs: '1.6rem', md: '1.9rem' },
                    mb: 1
                  }}
                >
                  {card.value}
                </Typography>
              )}

              {card.subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748B',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.7rem'
                  }}
                >
                  {card.subtitle}
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
