import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import axiosConfig from '../../config/axios';

const CotizacionViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [cotizacion, setCotizacion] = useState(null);

  useEffect(() => {
    if (id) {
      cargarCotizacion();
    }
    
    // Cleanup: liberar URL del blob cuando se desmonte el componente
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [id]);
  
  const cargarCotizacion = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos de la cotización
      const response = await axiosConfig.get(`/cotizaciones/${id}`);
      setCotizacion(response.data);
      
      // Descargar PDF como blob y crear URL para iframe
      const pdfResponse = await axiosConfig.get(`/cotizaciones/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Crear blob con tipo MIME correcto para que el navegador lo muestre
      const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(blobUrl);

    } catch (err) {
      console.error('Error cargando cotización:', err);
      setError(err.response?.data?.message || 'Error al cargar la cotización');
    } finally {
      setLoading(false);
    }
  };


  const handleDescargarPDF = async () => {
    try {
      const response = await axiosConfig.get(`/cotizaciones/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Cotizacion-${cotizacion?.numero || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando PDF:', err);
    }
  };

  const handleImprimir = () => {
    if (pdfUrl) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      };
    }
  };

  const handleEditar = () => {
    navigate(`/cotizaciones/${id}/editar`);
  };

  const handleVolver = () => {
    // Si la cotización tiene proyecto, ir al proyecto
    if (cotizacion?.proyecto) {
      navigate(`/proyectos/${cotizacion.proyecto}`);
    } else {
      // Si no, ir al dashboard
      navigate('/proyectos');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Generando PDF de cotización...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Esto puede tomar unos segundos
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={handleVolver}>
          Volver
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Volver al proyecto">
            <IconButton onClick={handleVolver}>
              <BackIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h5" fontWeight="600">
              {cotizacion?.numero || 'Cotización'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: ${cotizacion?.total?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Descargar PDF">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDescargarPDF}
            >
              Descargar
            </Button>
          </Tooltip>
          <Tooltip title="Imprimir">
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handleImprimir}
            >
              Imprimir
            </Button>
          </Tooltip>
          <Tooltip title="Modificar cotización">
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditar}
              color="primary"
            >
              Modificar
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* PDF Viewer - Iframe simple */}
      <Paper elevation={3} sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#view=FitH`}
            title="Cotización PDF"
            type="application/pdf"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="text.secondary">
              {loading ? 'Cargando PDF...' : 'No se pudo cargar el PDF'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CotizacionViewer;
