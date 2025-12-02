import React, { useState } from 'react';
import { Box, Typography, Grid, Collapse, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const PiezaCard = ({ 
  numero, 
  ancho, 
  alto, 
  area, 
  producto, 
  color, 
  modeloCodigo,
  galeria,
  tipoControl,
  tipoMando, // Nuevo prop
  caida,
  tipoInstalacion,
  tipoFijacion,
  modoOperacion,
  detalleTecnico,
  sistema,
  telaMarca,
  baseTabla,
  observacionesTecnicas,
  // Campos especiales
  galeriaCompartida,
  grupoGaleria,
  sistemaSkyline,
  motorCompartido,
  grupoMotor,
  piezasPorMotor,
  // Sistema Día/Noche
  tipoPiezaDiaNoche,
  numeroPiezaOriginal,
  // Área mínima cobrable
  areaCobrable,
  tieneAjusteMinimo
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Verificar si hay especificaciones técnicas
  const tieneEspecificaciones = galeria || tipoControl || tipoMando || caida || 
    tipoInstalacion || tipoFijacion || modoOperacion || detalleTecnico || 
    sistema || telaMarca || baseTabla || observacionesTecnicas;

  return (
    <Box
      sx={{
        bgcolor: 'white',
        border: '1px solid',
        borderColor: 'rgba(226, 232, 240, 1)', // slate-200
        borderRadius: '16px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        p: 2,
        mb: 1.5,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }
      }}
    >
      {/* Vista Compacta - Siempre visible */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: tieneEspecificaciones ? 'pointer' : 'default'
        }}
        onClick={tieneEspecificaciones ? handleToggle : undefined}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600, 
                color: 'rgba(30, 41, 59, 1)', // slate-800
              }}
            >
              🔹 Pieza {numero}{numeroPiezaOriginal ? ` (Medida ${numeroPiezaOriginal})` : ''}: {ancho} × {alto} m 
              {tieneAjusteMinimo ? (
                <span style={{ color: '#f59e0b' }}>
                  ({(area || (ancho * alto) || 0).toFixed(2)} m² → <strong>{(areaCobrable || 0).toFixed(2)} m²</strong> mín.)
                </span>
              ) : (
                <span>({(area || (ancho * alto) || 0).toFixed(2)} m²)</span>
              )}
            </Typography>
            {/* Indicador Sistema Día/Noche */}
            {tipoPiezaDiaNoche && (
              <Box sx={{ 
                bgcolor: tipoPiezaDiaNoche === 'blackout' ? '#1e293b' : '#fef3c7',
                color: tipoPiezaDiaNoche === 'blackout' ? '#fff' : '#92400e',
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                border: tipoPiezaDiaNoche === 'blackout' ? '1px solid #334155' : '1px solid #f59e0b',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                {tipoPiezaDiaNoche === 'blackout' ? '🌙 BLACKOUT' : '☀️ MALLA'}
              </Box>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: 'rgba(100, 116, 139, 1)' }}> {/* slate-500 */}
              <strong>Producto:</strong> {producto}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(100, 116, 139, 1)' }}>
              <strong>Color:</strong> {color}
            </Typography>
            {modeloCodigo && (
              <Typography variant="body2" sx={{ color: 'rgba(100, 116, 139, 1)' }}>
                <strong>Modelo:</strong> {modeloCodigo}
              </Typography>
            )}
          </Box>
        </Box>

        {tieneEspecificaciones && (
          <IconButton
            onClick={handleToggle}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-in-out',
              color: 'rgba(100, 116, 139, 1)'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        )}
      </Box>

      {/* Vista Expandida - Especificaciones Técnicas */}
      {tieneEspecificaciones && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(226, 232, 240, 1)' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 700, 
                color: '#2196f3', 
                display: 'block', 
                mb: 1.5,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              🔧 Especificaciones Técnicas
            </Typography>

            <Grid container spacing={2}>
              {/* Columna 1: Instalación y Estructura */}
              {(galeria || tipoInstalacion || tipoFijacion || detalleTecnico) && (
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {galeria && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Galería/Cabezal
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                          {galeria === 'galeria' ? 'Galería' :
                           galeria === 'cassette' ? 'Cassette' :
                           galeria === 'cabezal' ? 'Cabezal' :
                           galeria === 'sin_galeria' ? 'Sin Galería' :
                           galeria}
                        </Typography>
                      </Box>
                    )}
                    {tipoInstalacion && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Instalación
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', textTransform: 'capitalize' }}>
                          {tipoInstalacion}
                        </Typography>
                      </Box>
                    )}
                    {tipoFijacion && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Fijación
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', textTransform: 'capitalize' }}>
                          {tipoFijacion}
                        </Typography>
                      </Box>
                    )}
                    {detalleTecnico && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Detalle
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                          {detalleTecnico === 'traslape' ? 'Traslape' :
                           detalleTecnico === 'corte' ? 'Corte' :
                           detalleTecnico === 'sin_traslape' ? 'Sin traslape' :
                           detalleTecnico}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}

              {/* Columna 2: Control y Operación */}
              {(tipoControl || tipoMando || caida || modoOperacion || sistema) && (
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {tipoControl && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Lado Control
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', textTransform: 'capitalize' }}>
                          {tipoControl}
                        </Typography>
                      </Box>
                    )}
                    {tipoMando && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Tipo Mando
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)', textTransform: 'capitalize' }}>
                          {tipoMando}
                        </Typography>
                      </Box>
                    )}
                    {caida && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Caída
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                          {caida === 'normal' ? 'Normal' :
                           caida === 'frente' ? 'Hacia el Frente' :
                           caida}
                        </Typography>
                      </Box>
                    )}
                    {modoOperacion && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Operación
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                          {modoOperacion === 'manual' ? 'Manual' :
                           modoOperacion === 'motorizado' ? 'Motorizado' :
                           modoOperacion}
                        </Typography>
                      </Box>
                    )}
                    {sistema && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Sistema
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                          {sistema}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}

              {/* Columna 3: Materiales y Otros */}
              {(telaMarca || baseTabla) && (
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {telaMarca && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Tela/Marca
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                          {telaMarca}
                        </Typography>
                      </Box>
                    )}
                    {baseTabla && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block' }}>
                          Base Tabla
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                          {baseTabla}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}

              {/* Observaciones - Ancho completo */}
              {observacionesTecnicas && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    bgcolor: 'rgba(241, 245, 249, 1)', // slate-100
                    p: 1.5, 
                    borderRadius: '8px',
                    borderLeft: '3px solid #2196f3'
                  }}>
                    <Typography variant="caption" sx={{ color: 'rgba(100, 116, 139, 1)', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      📝 Observaciones
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(30, 41, 59, 1)' }}>
                      {observacionesTecnicas}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Campos Especiales - Ancho completo */}
              {(galeriaCompartida || sistemaSkyline || motorCompartido) && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {galeriaCompartida && (
                      <Box sx={{ 
                        bgcolor: '#bfdbfe', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: '6px',
                        border: '1px solid #3b82f6'
                      }}>
                        <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600 }}>
                          🔗 Galería Compartida - Grupo {grupoGaleria || 'A'}
                        </Typography>
                      </Box>
                    )}
                    
                    {sistemaSkyline && (
                      <Box sx={{ 
                        bgcolor: '#fef3c7', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: '6px',
                        border: '1px solid #fbbf24'
                      }}>
                        <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                          ⭐ Sistema Skyline
                        </Typography>
                      </Box>
                    )}
                    
                    {motorCompartido && (
                      <Box sx={{ 
                        bgcolor: '#dbeafe', 
                        px: 1.5, 
                        py: 0.5, 
                        borderRadius: '6px',
                        border: '1px solid #3b82f6'
                      }}>
                        <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600 }}>
                          🔌 Motor Compartido - Grupo {grupoMotor || 'M1'} ({piezasPorMotor || 1} piezas)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default PiezaCard;
