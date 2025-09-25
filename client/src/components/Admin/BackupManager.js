import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel,
  Switch, LinearProgress, Chip, Divider, List, ListItem, ListItemIcon,
  ListItemText, IconButton, Tooltip, Paper
} from '@mui/material';
import {
  CloudDownload, CloudUpload, Assessment, Refresh, Info, Warning,
  Storage, People, Message, Archive, Delete, CheckCircle, Error,
  Schedule, GetApp, Backup, RestoreFromTrash
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const BackupManager = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  
  // Estados para exportación
  const [exportOptions, setExportOptions] = useState({
    incluirArchivados: false,
    incluirPapelera: false,
    formato: 'json' // 'json' o 'excel'
  });
  
  // Estados para importación
  const [importDialog, setImportDialog] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importOptions, setImportOptions] = useState({
    importProspectos: true,
    importPlantillas: true,
    overwriteExisting: false
  });

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      setLoading(true);
      const response = await axiosConfig.get('/backup/system-info');
      setSystemInfo(response.data);
    } catch (error) {
      console.error('Error obteniendo información del sistema:', error);
      setAlert({
        open: true,
        message: '❌ Error obteniendo información del sistema',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportComplete = async () => {
    try {
      setLoading(true);
      
      const response = await axiosConfig.get('/backup/export/complete', {
        responseType: 'blob'
      });
      
      // Crear y descargar archivo
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sundeck_backup_completo_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setAlert({
        open: true,
        message: '✅ Backup completo descargado exitosamente',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error en backup completo:', error);
      setAlert({
        open: true,
        message: '❌ Error generando backup completo',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportProspectos = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        incluirArchivados: exportOptions.incluirArchivados,
        incluirPapelera: exportOptions.incluirPapelera
      });
      
      if (exportOptions.formato === 'excel') {
        // Exportar Excel
        const response = await axiosConfig.get(`/backup/export/excel?${params}`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prospectos_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } else {
        // Exportar JSON
        const response = await axiosConfig.get(`/backup/export/prospectos?${params}`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prospectos_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      setAlert({
        open: true,
        message: `✅ Prospectos exportados en formato ${exportOptions.formato.toUpperCase()}`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Error exportando prospectos:', error);
      setAlert({
        open: true,
        message: '❌ Error exportando prospectos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setAlert({
        open: true,
        message: '❌ Selecciona un archivo para importar',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Leer archivo
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(importFile);
      });
      
      const backupData = JSON.parse(fileContent);
      
      // Enviar al servidor
      const response = await axiosConfig.post('/backup/import', {
        backupData,
        options: importOptions
      });
      
      setAlert({
        open: true,
        message: `✅ Importación completada: ${JSON.stringify(response.data.results.imported)}`,
        severity: 'success'
      });
      
      setImportDialog(false);
      setImportFile(null);
      fetchSystemInfo(); // Actualizar estadísticas
      
    } catch (error) {
      console.error('Error importando:', error);
      setAlert({
        open: true,
        message: `❌ Error en importación: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-MX').format(num);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          🗄️ Gestión de Backups
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchSystemInfo}
          disabled={loading}
        >
          Actualizar Info
        </Button>
      </Box>

      {/* Información del Sistema */}
      {systemInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Estado Actual del Sistema
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                  <Storage color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" color="primary">
                    {formatNumber(systemInfo.database.prospectos.total)}
                  </Typography>
                  <Typography variant="body2">Total Prospectos</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip size="small" label={`${systemInfo.database.prospectos.activos} Activos`} color="success" />
                    <Chip size="small" label={`${systemInfo.database.prospectos.archivados} Archivados`} color="warning" sx={{ ml: 0.5 }} />
                    <Chip size="small" label={`${systemInfo.database.prospectos.enPapelera} Papelera`} color="error" sx={{ ml: 0.5 }} />
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                  <People color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" color="secondary">
                    {formatNumber(systemInfo.database.usuarios)}
                  </Typography>
                  <Typography variant="body2">Usuarios</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e8' }}>
                  <Message color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" color="success.main">
                    {formatNumber(systemInfo.database.plantillasWhatsApp)}
                  </Typography>
                  <Typography variant="body2">Plantillas WhatsApp</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                  <Assessment color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" color="warning.main">
                    {formatBytes(systemInfo.server.memoryUsage.heapUsed)}
                  </Typography>
                  <Typography variant="body2">Memoria en Uso</Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Opciones de Exportación */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📤 Exportar Datos
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Descarga copias de seguridad de tus datos para mantenerlos seguros
              </Alert>

              {/* Backup Completo */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  🗄️ Backup Completo del Sistema
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Incluye todos los prospectos, usuarios, plantillas y configuraciones
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudDownload />}
                  onClick={handleExportComplete}
                  disabled={loading}
                  fullWidth
                  size="large"
                >
                  Descargar Backup Completo
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Backup de Prospectos */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  📋 Backup de Prospectos
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.incluirArchivados}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          incluirArchivados: e.target.checked
                        }))}
                      />
                    }
                    label="Incluir prospectos archivados"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={exportOptions.incluirPapelera}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          incluirPapelera: e.target.checked
                        }))}
                      />
                    }
                    label="Incluir prospectos en papelera"
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      startIcon={<GetApp />}
                      onClick={() => {
                        setExportOptions(prev => ({ ...prev, formato: 'json' }));
                        handleExportProspectos();
                      }}
                      disabled={loading}
                      fullWidth
                    >
                      JSON
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      startIcon={<Assessment />}
                      onClick={() => {
                        setExportOptions(prev => ({ ...prev, formato: 'excel' }));
                        handleExportProspectos();
                      }}
                      disabled={loading}
                      fullWidth
                    >
                      Excel
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📥 Importar Datos
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                ⚠️ Solo para administradores. Úsalo para restaurar datos de backups previos.
              </Alert>

              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setImportDialog(true)}
                disabled={loading}
                fullWidth
                size="large"
                color="secondary"
              >
                Restaurar desde Backup
              </Button>

              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📋 Recomendaciones de Backup:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><Schedule fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="Backup diario" 
                      secondary="Exporta prospectos activos diariamente"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Backup fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="Backup completo semanal" 
                      secondary="Incluye todo el sistema cada semana"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Archive fontSize="small" /></ListItemIcon>
                    <ListItemText 
                      primary="Backup mensual con archivados" 
                      secondary="Incluye archivados y papelera mensualmente"
                    />
                  </ListItem>
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Bar */}
      {loading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Procesando... Por favor espera
          </Typography>
        </Box>
      )}

      {/* Dialog de Importación */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📥 Importar Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Esta acción puede sobrescribir datos existentes. Asegúrate de tener un backup actual antes de proceder.
          </Alert>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Seleccionar archivo de backup:
            </Typography>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
              style={{ width: '100%', padding: '8px' }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Opciones de importación:
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={importOptions.importProspectos}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    importProspectos: e.target.checked
                  }))}
                />
              }
              label="Importar prospectos"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={importOptions.importPlantillas}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    importPlantillas: e.target.checked
                  }))}
                />
              }
              label="Importar plantillas WhatsApp"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={importOptions.overwriteExisting}
                  onChange={(e) => setImportOptions(prev => ({
                    ...prev,
                    overwriteExisting: e.target.checked
                  }))}
                />
              }
              label="Sobrescribir datos existentes"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleImport} 
            variant="contained" 
            disabled={!importFile || loading}
          >
            Importar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para alertas */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, open: false })} 
          severity={alert.severity}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BackupManager;
