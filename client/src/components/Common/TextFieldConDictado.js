import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  IconButton,
  Box,
  Tooltip,
  Chip,
  Alert,
  Fade
} from '@mui/material';
import {
  Mic,
  MicOff,
  Stop,
  VolumeUp
} from '@mui/icons-material';

const TextFieldConDictado = ({ 
  value, 
  onChange, 
  label, 
  placeholder,
  multiline = true,
  rows = 4,
  fullWidth = true,
  disabled = false,
  ...props 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Sincronizar valor interno con prop externa
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  useEffect(() => {
    // Verificar si el navegador soporta Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // Configuración del reconocimiento de voz
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-MX'; // Español de México
      
      // Eventos del reconocimiento
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError('');
        console.log('🎤 Dictado iniciado');
      };
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          const newValue = internalValue + (internalValue ? ' ' : '') + finalTranscript;
          setInternalValue(newValue);
          
          // Crear un evento sintético compatible
          const syntheticEvent = {
            target: { value: newValue },
            currentTarget: { value: newValue }
          };
          onChange(syntheticEvent);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }
        
        setTranscript(interimTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Error en dictado:', event.error);
        setIsListening(false);
        
        switch(event.error) {
          case 'no-speech':
            setError('No se detectó voz. Intenta hablar más cerca del micrófono.');
            break;
          case 'audio-capture':
            setError('No se pudo acceder al micrófono. Verifica los permisos.');
            break;
          case 'not-allowed':
            setError('Acceso al micrófono denegado. Permite el acceso en tu navegador.');
            break;
          case 'network':
            setError('Error de conexión. Verifica tu conexión a internet.');
            break;
          default:
            setError('Error en el dictado. Intenta nuevamente.');
        }
        
        // Limpiar error después de 5 segundos
        setTimeout(() => setError(''), 5000);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        setTranscript('');
        console.log('🎤 Dictado finalizado');
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    
    try {
      recognitionRef.current.start();
      
      // Auto-detener después de 30 segundos para evitar uso excesivo
      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000);
      
    } catch (error) {
      console.error('Error iniciando dictado:', error);
      setError('No se pudo iniciar el dictado. Intenta nuevamente.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const leerTexto = () => {
    if (!internalValue || !('speechSynthesis' in window)) return;
    
    // Detener cualquier lectura anterior
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(internalValue);
    utterance.lang = 'es-MX';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  // Manejar cambios manuales en el TextField
  const handleManualChange = (event) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    onChange(event);
  };

  return (
    <Box>
      <TextField
        {...props}
        value={internalValue}
        onChange={handleManualChange}
        label={label}
        placeholder={placeholder || (isSupported ? "Escribe aquí o usa el dictado por voz..." : "Escribe aquí...")}
        multiline={multiline}
        rows={rows}
        fullWidth={fullWidth}
        disabled={disabled}
        InputProps={{
          ...props.InputProps,
          endAdornment: (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
              {/* Botón de dictado */}
              {isSupported && (
                <Tooltip title={isListening ? "Detener dictado" : "Iniciar dictado por voz"}>
                  <IconButton
                    onClick={toggleListening}
                    disabled={disabled}
                    size="small"
                    sx={{
                      color: isListening ? '#f44336' : '#2196f3',
                      backgroundColor: isListening ? '#ffebee' : '#e3f2fd',
                      '&:hover': {
                        backgroundColor: isListening ? '#ffcdd2' : '#bbdefb'
                      },
                      animation: isListening ? 'pulse 1.5s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' }
                      }
                    }}
                  >
                    {isListening ? <Stop /> : <Mic />}
                  </IconButton>
                </Tooltip>
              )}
              
              {/* Botón de lectura */}
              {internalValue && 'speechSynthesis' in window && (
                <Tooltip title="Leer texto en voz alta">
                  <IconButton
                    onClick={leerTexto}
                    disabled={disabled}
                    size="small"
                    sx={{
                      color: '#4caf50',
                      backgroundColor: '#e8f5e8',
                      '&:hover': {
                        backgroundColor: '#c8e6c9'
                      }
                    }}
                  >
                    <VolumeUp />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }}
        sx={{
          '& .MuiInputBase-root': {
            alignItems: 'flex-start'
          }
        }}
      />
      
      {/* Indicadores de estado */}
      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {isListening && (
          <Chip
            icon={<Mic />}
            label="Escuchando..."
            color="error"
            size="small"
            sx={{ animation: 'pulse 1.5s infinite' }}
          />
        )}
        
        {transcript && (
          <Chip
            label={`Detectando: "${transcript}"`}
            color="info"
            size="small"
            variant="outlined"
          />
        )}
        
        {!isSupported && (
          <Chip
            label="Dictado no disponible en este navegador"
            color="warning"
            size="small"
            variant="outlined"
          />
        )}
      </Box>
      
      {/* Mensaje de éxito */}
      <Fade in={showSuccess}>
        <Alert 
          severity="success" 
          sx={{ mt: 1, display: showSuccess ? 'flex' : 'none' }}
          onClose={() => setShowSuccess(false)}
        >
          ✅ Texto agregado correctamente
        </Alert>
      </Fade>
      
      {/* Mensaje de error */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 1 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
      
      {/* Instrucciones de uso */}
      {isSupported && !internalValue && !isListening && (
        <Box sx={{ mt: 1 }}>
          <Chip
            icon={<Mic />}
            label="💡 Tip: Haz clic en el micrófono para dictar"
            variant="outlined"
            size="small"
            sx={{ color: '#666' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default TextFieldConDictado;
