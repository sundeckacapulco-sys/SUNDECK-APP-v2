import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Fab,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Assignment,
  Build,
  Construction,
  RateReview,
  Assessment,
  ViewKanban,
  Notifications,
  AccountCircle,
  Logout,
  Settings,
  Inventory,
  WhatsApp,
  Security,
  Home,
  Calculate,
  Science
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BotonCapturaFlotante } from '../Common/CapturaModal';
import { BotonInspectorSimple } from '../Common/InspectorSimple';
import { BotonDevToolsInspector } from '../Common/DevToolsInspector';
import { BotonSelectorDirecto } from '../Common/InspectorDirecto';
import axiosConfig from '../../config/axios';
import { SoporteProvider } from '../Common/ModuloSoporte';
import ModuloSoporte from '../Common/ModuloSoporte';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Proyectos', icon: <Assignment />, path: '/proyectos', badge: 'PRINCIPAL' },
  { text: 'Alertas', icon: <Notifications />, path: '/alertas', badge: 'NUEVO' },
  { text: 'Cotización Directa', icon: <Calculate />, path: '/cotizacion-directa', badge: 'RÁPIDO' },
  { text: 'Fabricación', icon: <Construction />, path: '/fabricacion' },
  { text: 'Calculadora Materiales', icon: <Calculate />, path: '/calculadora', badge: 'NUEVO' },
  { 
    text: 'Instalaciones', 
    icon: <Home />, 
    path: '/instalaciones', 
    badge: 'SEPARADO',
    submenu: [
      { text: 'Lista de Instalaciones', path: '/instalaciones' },
      { text: 'Programar Instalación', path: '/instalaciones/programar' },
      { text: 'Calendario', path: '/instalaciones/calendario' },
      { text: 'KPIs Instalaciones', path: '/instalaciones/kpis' }
    ]
  },
  { text: 'KPIs y Ventas', icon: <Assessment />, path: '/kpis' },
  { text: 'Catálogo Productos', icon: <Inventory />, path: '/productos' },
  { text: 'Plantillas WhatsApp', icon: <WhatsApp />, path: '/admin/plantillas-whatsapp' }
];

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [soporteModalOpen, setSoporteModalOpen] = useState(false);
  const [alertasResumen, setAlertasResumen] = useState({ total: 0, prospectos: 0, proyectos: 0 });
  const [alertasLoading, setAlertasLoading] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  useEffect(() => {
    let activo = true;

    const cargarAlertas = async () => {
      try {
        setAlertasLoading(true);
        const response = await axiosConfig.get('/alertas/inteligentes', { params: { limite: 3 } });
        if (!activo) return;

        const data = response?.data?.data || response?.data || {};

        setAlertasResumen({
          total: data?.resumen?.total ?? 0,
          prospectos: data?.resumen?.prospectosInactivos ?? 0,
          proyectos: data?.resumen?.proyectosSinMovimiento ?? 0
        });
      } catch (error) {
        if (activo) {
          setAlertasResumen((prev) => ({ ...prev }));
        }
      } finally {
        if (activo) {
          setAlertasLoading(false);
        }
      }
    };

    cargarAlertas();
    const intervalo = setInterval(cargarAlertas, 5 * 60 * 1000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  const drawer = (
    <div style={{ backgroundColor: '#000000', height: '100%' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        py: 2,
        backgroundColor: '#000000'
      }}>
        <Box sx={{ mb: 1 }}>
          <img 
            src="/assets/sundeck-logo.svg" 
            alt="Sundeck Logo" 
            style={{ 
              height: '60px', 
              width: 'auto',
              maxWidth: '200px'
            }} 
          />
        </Box>
        <Typography variant="caption" color="#ffffff" textAlign="center">
          Sistema CRM
        </Typography>
      </Toolbar>
      <Divider sx={{ backgroundColor: '#333333' }} />
      <List sx={{ backgroundColor: '#000000', height: '100%' }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: '#1E40AF',
                },
                '&.Mui-selected': {
                  backgroundColor: '#1E40AF',
                  '&:hover': {
                    backgroundColor: '#1E3A8A',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: '#ffffff' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{item.text}</span>
                    {item.badge && (
                      <Chip 
                        label={item.badge} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#D4AF37', 
                          color: '#000', 
                          fontSize: '0.6rem',
                          height: '16px',
                          fontWeight: 'bold'
                        }} 
                      />
                    )}
                  </Box>
                }
                sx={{ 
                  '& .MuiListItemText-primary': { 
                    fontSize: '0.875rem',
                    fontWeight: 500
                  } 
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <SoporteProvider>
      <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box sx={{ display: { xs: 'block', sm: 'none' }, mr: 2 }}>
              <img 
                src="/assets/sundeck-logo.svg" 
                alt="Sundeck Logo" 
                style={{ 
                  height: '32px', 
                  width: 'auto'
                }} 
              />
            </Box>
            <Typography variant="h6" noWrap component="div">
              {menuItems.find(item => item.path === location.pathname)?.text || 'Sundeck CRM'}
            </Typography>
          </Box>

          <IconButton color="inherit" sx={{ mr: 1 }} onClick={() => navigate('/alertas')}>
            <Badge
              badgeContent={alertasLoading ? '…' : alertasResumen.total}
              color={alertasResumen.total > 0 ? 'error' : 'default'}
            >
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.nombre?.charAt(0)}
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>
                <Typography variant="body2">
                  {user?.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.rol}
                </Typography>
              </ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              navigate('/configuracion');
              handleMenuClose();
            }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Configuración</ListItemText>
            </MenuItem>
            
            {/* Módulo de Soporte - Solo para Admins */}
            {user && (user.role === 'admin' || user.role === 'administrador' || user.nombre === 'Admin Sundeck') && (
              <MenuItem onClick={() => {
                setSoporteModalOpen(true);
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <Security fontSize="small" sx={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>🔒 Soporte Técnico</span>
                    <Chip label="Admin" size="small" color="warning" variant="outlined" />
                  </Box>
                </ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#000000'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: '#000000'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        {children}
      </Box>
      
      {/* Botones flotantes para soporte */}
      <BotonCapturaFlotante />
      <BotonInspectorSimple />
      <BotonDevToolsInspector />
      <BotonSelectorDirecto />
      
      {/* Modal del Módulo de Soporte */}
      <ModuloSoporte
        open={soporteModalOpen}
        onClose={() => setSoporteModalOpen(false)}
      />
      </Box>
    </SoporteProvider>
  );

};

export default Layout;
