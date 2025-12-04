import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  NavigateBefore,
  NavigateNext,
  ZoomIn,
  ZoomOut,
  FirstPage,
  LastPage
} from '@mui/icons-material';

// Configurar worker de PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const VisorPDF = ({ url, onLoadSuccess }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    if (onLoadSuccess) onLoadSuccess(numPages);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      bgcolor: '#525659'
    }}>
      {/* Barra de navegación */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: 1,
        py: 1,
        bgcolor: '#3d3d3d',
        borderBottom: '1px solid #555'
      }}>
        <Tooltip title="Primera página">
          <IconButton 
            onClick={() => goToPage(1)} 
            disabled={pageNumber <= 1}
            sx={{ color: '#fff' }}
            size="small"
          >
            <FirstPage />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Anterior">
          <IconButton 
            onClick={() => goToPage(pageNumber - 1)} 
            disabled={pageNumber <= 1}
            sx={{ color: '#fff' }}
            size="small"
          >
            <NavigateBefore />
          </IconButton>
        </Tooltip>
        
        <Typography sx={{ color: '#fff', mx: 2, minWidth: 80, textAlign: 'center' }}>
          {pageNumber} / {numPages || '-'}
        </Typography>
        
        <Tooltip title="Siguiente">
          <IconButton 
            onClick={() => goToPage(pageNumber + 1)} 
            disabled={pageNumber >= numPages}
            sx={{ color: '#fff' }}
            size="small"
          >
            <NavigateNext />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Última página">
          <IconButton 
            onClick={() => goToPage(numPages)} 
            disabled={pageNumber >= numPages}
            sx={{ color: '#fff' }}
            size="small"
          >
            <LastPage />
          </IconButton>
        </Tooltip>

        <Box sx={{ mx: 2, borderLeft: '1px solid #555', height: 24 }} />

        <Tooltip title="Alejar">
          <IconButton 
            onClick={zoomOut} 
            disabled={scale <= 0.5}
            sx={{ color: '#fff' }}
            size="small"
          >
            <ZoomOut />
          </IconButton>
        </Tooltip>
        
        <Typography sx={{ color: '#fff', minWidth: 50, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </Typography>
        
        <Tooltip title="Acercar">
          <IconButton 
            onClick={zoomIn} 
            disabled={scale >= 2.5}
            sx={{ color: '#fff' }}
            size="small"
          >
            <ZoomIn />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Contenedor del PDF */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        display: 'flex', 
        justifyContent: 'center',
        py: 2
      }}>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress sx={{ color: '#D4AF37' }} />
            <Typography sx={{ color: '#fff' }}>Cargando PDF...</Typography>
          </Box>
        )}
        
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => console.error('Error cargando PDF:', error)}
          loading={null}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </Box>
    </Box>
  );
};

export default VisorPDF;
