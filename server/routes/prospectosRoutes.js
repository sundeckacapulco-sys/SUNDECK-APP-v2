const express = require('express');
const router = express.Router();

// Placeholder route to allow the server to start.
// This will be replaced with the actual routes.
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Ruta de prospectos funcional. Lógica pendiente de restauración.' });
});

module.exports = router;
