//Importacion css
import './ConfirmDialog.css';

//DIALOGO DE CONFIRMACION
//Por ejemplo al borrar un moodboard
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

//Componente tipo ConfirmDialogProps
//Pasamos las propiedades a traves de la desestructuracion
export function ConfirmDialog({
  //Si se abre o no
  open,
  //Titulo del cuadro
  title,
  //Mensaje del cuadro
  message,
  //Texto boton confirmar
  confirmLabel = 'Confirmar',
  //Texto boton cancelar
  cancelLabel = 'Cancelar',
  //Accion de confirmar
  onConfirm,
  //Accion de cancelar
  onCancel,
}: ConfirmDialogProps) {
  //Si no esta abierto, si open es false
  //No regresa / renderiza nada
  if (!open) {
    return null;
  }

  //RENDERIZADO
  return (
    //Caja que contiene como el fondo asi más oscurito de detras de los modales + el contenido
    //Si haces click fuera se cancela y se cierra
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onCancel}>
      {/**Caja del modal */}
      <div
        className="confirm-dialog card card--elevated"
        //Indica que es un modal
        role="dialog"
        //Bloquea la interaccion con el resto de la pagina
        aria-modal="true"
        //Conecta con el titulo
        aria-labelledby="confirm-dialog-title"
        //Evita que se cierre al hacer click dentro del modal
        onClick={(e) => e.stopPropagation()}
      >
        {/**Contenido del modal, titulo, mensaje, botones */}
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          {/**Si clickas en cancelar se cierra el modal */}
          <button type="button" className="dashboard-card-btn" 
          onClick={onCancel}>
            {cancelLabel}
          </button>
          {/**Si clickas en confirmar se ejecuta la accion*/}
          <button
            type="button"
            className="dashboard-card-btn dashboard-card-btn--danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
