/**
 * Script de Prueba para Validar la Migración
 * 
 * Este componente permite comparar lado a lado el comportamiento
 * del modal original vs el migrado para asegurar equivalencia.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  Paper,
  Divider
} from '@mui/material';
import { Compare, BugReport, CheckCircle } from '@mui/icons-material';

// Importar ambas versiones
import AgregarEtapaModal from './AgregarEtapaModal'; // Original
import AgregarEtapaModalUnificado from './AgregarEtapaModalUnificado'; // Migrado

const TestMigracion = () => {
  const [tabActual, setTabActual] = useState(0);
  const [modalOriginalOpen, setModalOriginalOpen] = useState(false);
  const [modalMigradoOpen, setModalMigradoOpen] = useState(false);
  const [resultadoOriginal, setResultadoOriginal] = useState(null);
  const [resultadoMigrado, setResultadoMigrado] = useState(null);
  const [comparacion, setComparacion] = useState(null);

  const prospectoIdPrueba = 'test_prospecto_123';

  const casosDeProeba = [
    {
      id: 'levantamiento_basico',
      nombre: 'Levantamiento Técnico Básico',
      descripcion: 'Captura técnica sin precios',
      tipoVisita: 'levantamiento',
      datos: {
        productos: [
          {
            nombre: 'Persiana Screen 3%',
            ubicacion: 'Recámara',
            ancho: 2.5,
            alto: 3.0,
            color: 'Blanco'
          }
        ]
      }
    },
    {
      id: 'cotizacion_vivo',
      nombre: 'Cotización en Vivo',
      descripcion: 'Cotización con precios durante visita',
      tipoVisita: 'cotizacion',
      datos: {
        productos: [
          {
            nombre: 'Toldo Vertical',
            ubicacion: 'Terraza',
            ancho: 4.0,
            alto: 3.5,
            precio: 850,
            motorizado: true,
            esToldo: true
          }
        ],
        instalacion: {
          activa: true,
          tipo: 'eléctrica',
          precio: 5000
        }
      }
    },
    {
      id: 'multiple_productos',
      nombre: 'Múltiples Productos',
      descripción: 'Varios productos con diferentes configuraciones',
      tipoVisita: 'cotizacion',
      datos: {
        productos: [
          {
            nombre: 'Persiana Enrollable',
            ubicacion: 'Sala',
            ancho: 3.0,
            alto: 2.8,
            precio: 750
          },
          {
            nombre: 'Cortina Tradicional',
            ubicacion: 'Comedor',
            ancho: 2.2,
            alto: 2.5,
            precio: 650,
            motorizado: true
          }
        ]
      }
    }
  ];

  const ejecutarCasoPrueba = async (caso) => {
    console.log(`🧪 Ejecutando caso de prueba: ${caso.nombre}`);
    
    // Simular datos de entrada
    const datosEntrada = {
      prospectoId: prospectoIdPrueba,
      tipoVisitaInicial: caso.tipoVisita,
      ...caso.datos
    };

    return datosEntrada;
  };

  const compararResultados = (original, migrado) => {
    const comparacion = {
      equivalente: true,
      diferencias: [],
      metricas: {}
    };

    // Comparar estructura básica
    if (original?.productos?.length !== migrado?.productos?.length) {
      comparacion.equivalente = false;
      comparacion.diferencias.push(
        `Número de productos: ${original?.productos?.length || 0} vs ${migrado?.productos?.length || 0}`
      );
    }

    // Comparar totales (si existen)
    if (original?.totales && migrado?.totales) {
      const diferenciaTotal = Math.abs(original.totales.total - migrado.totales.total);
      if (diferenciaTotal > 0.01) {
        comparacion.equivalente = false;
        comparacion.diferencias.push(
          `Total: $${original.totales.total} vs $${migrado.totales.total}`
        );
      }
    }

    // Métricas de rendimiento
    comparacion.metricas = {
      tiempoOriginal: original?.tiempo || 0,
      tiempoMigrado: migrado?.tiempo || 0,
      mejora: original?.tiempo && migrado?.tiempo 
        ? ((original.tiempo - migrado.tiempo) / original.tiempo * 100).toFixed(2) + '%'
        : 'N/A'
    };

    return comparacion;
  };

  const handleModalOriginalSaved = (resultado) => {
    setResultadoOriginal({
      ...resultado,
      tiempo: Date.now() - (resultado.inicioTiempo || Date.now())
    });
    setModalOriginalOpen(false);
  };

  const handleModalMigradoSaved = (resultado) => {
    setResultadoMigrado({
      ...resultado,
      tiempo: Date.now() - (resultado.inicioTiempo || Date.now())
    });
    setModalMigradoOpen(false);
  };

  // Comparar automáticamente cuando ambos resultados están disponibles
  React.useEffect(() => {
    if (resultadoOriginal && resultadoMigrado) {
      const comp = compararResultados(resultadoOriginal, resultadoMigrado);
      setComparacion(comp);
    }
  }, [resultadoOriginal, resultadoMigrado]);

  const renderCasosPrueba = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Casos de Prueba Disponibles
      </Typography>
      
      <Grid container spacing={2}>
        {casosDeProeba.map((caso) => (
          <Grid item xs={12} md={4} key={caso.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {caso.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {caso.descripcion}
                </Typography>
                
                <Box display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      ejecutarCasoPrueba(caso);
                      setModalOriginalOpen(true);
                    }}
                  >
                    Original
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      ejecutarCasoPrueba(caso);
                      setModalMigradoOpen(true);
                    }}
                  >
                    Migrado
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderComparacion = () => {
    if (!comparacion) {
      return (
        <Alert severity="info">
          Ejecuta un caso de prueba en ambas versiones para ver la comparación.
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Resultado de la Comparación
        </Typography>
        
        {comparacion.equivalente ? (
          <Alert severity="success" icon={<CheckCircle />}>
            ✅ Los resultados son equivalentes - La migración es exitosa
          </Alert>
        ) : (
          <Alert severity="warning" icon={<BugReport />}>
            ⚠️ Se encontraron diferencias que requieren atención
          </Alert>
        )}

        {comparacion.diferencias.length > 0 && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Diferencias Encontradas:
              </Typography>
              <ul>
                {comparacion.diferencias.map((diferencia, index) => (
                  <li key={index}>{diferencia}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Métricas de Rendimiento:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2">
                  Tiempo Original: {comparacion.metricas.tiempoOriginal}ms
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2">
                  Tiempo Migrado: {comparacion.metricas.tiempoMigrado}ms
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="success.main">
                  Mejora: {comparacion.metricas.mejora}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderResultados = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resultado Original
          </Typography>
          {resultadoOriginal ? (
            <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
              {JSON.stringify(resultadoOriginal, null, 2)}
            </pre>
          ) : (
            <Typography color="text.secondary">
              No hay resultado disponible
            </Typography>
          )}
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Resultado Migrado
          </Typography>
          {resultadoMigrado ? (
            <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '400px' }}>
              {JSON.stringify(resultadoMigrado, null, 2)}
            </pre>
          ) : (
            <Typography color="text.secondary">
              No hay resultado disponible
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Test de Migración: AgregarEtapaModal
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Esta herramienta permite comparar el comportamiento del modal original 
        vs el migrado para validar que la funcionalidad se mantiene equivalente.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabActual} onChange={(e, newValue) => setTabActual(newValue)}>
          <Tab label="Casos de Prueba" />
          <Tab label="Comparación" />
          <Tab label="Resultados Detallados" />
        </Tabs>
      </Box>

      {tabActual === 0 && renderCasosPrueba()}
      {tabActual === 1 && renderComparacion()}
      {tabActual === 2 && renderResultados()}

      {/* Botones de acción */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => {
            setResultadoOriginal(null);
            setResultadoMigrado(null);
            setComparacion(null);
          }}
        >
          Limpiar Resultados
        </Button>
        
        <Button
          variant="contained"
          startIcon={<Compare />}
          disabled={!resultadoOriginal || !resultadoMigrado}
          onClick={() => {
            const comp = compararResultados(resultadoOriginal, resultadoMigrado);
            setComparacion(comp);
            setTabActual(1);
          }}
        >
          Comparar Resultados
        </Button>
      </Box>

      {/* Modales */}
      <AgregarEtapaModal
        open={modalOriginalOpen}
        onClose={() => setModalOriginalOpen(false)}
        prospectoId={prospectoIdPrueba}
        onSaved={handleModalOriginalSaved}
        onError={(error) => console.error('Error modal original:', error)}
      />
      
      <AgregarEtapaModalUnificado
        open={modalMigradoOpen}
        onClose={() => setModalMigradoOpen(false)}
        prospectoId={prospectoIdPrueba}
        onSaved={handleModalMigradoSaved}
        onError={(error) => console.error('Error modal migrado:', error)}
        tipoVisitaInicial="levantamiento"
      />
    </Box>
  );
};

export default TestMigracion;
