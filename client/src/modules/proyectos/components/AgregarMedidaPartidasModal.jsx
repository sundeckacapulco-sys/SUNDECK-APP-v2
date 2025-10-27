import AgregarMedidaProyectoModal from './AgregarMedidaProyectoModal';

/**
 * Este modal es un alias del modal de proyecto para mantener compatibilidad con
 * rutas y componentes existentes que aún esperan la antigua versión enfocada en
 * partidas. Al reutilizar la misma implementación evitamos duplicar lógica y
 * garantizamos que las validaciones, cálculos y mejoras recientes aplican por
 * igual sin provocar conflictos de nombres como el de `calcularAreaPieza` que
 * surgía en la implementación previa.
 */
const AgregarMedidaPartidasModal = (props) => (
  <AgregarMedidaProyectoModal {...props} />
);

export default AgregarMedidaPartidasModal;
