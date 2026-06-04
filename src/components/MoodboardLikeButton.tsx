import { useState, type MouseEvent } from 'react';
//Funciones que realizan peticiones http al backend, likeMoodboard
//hace un post y unlikeMoodboard un delete
import { likeMoodboard, unlikeMoodboard } from '../api/moodboards';
import iconStar from '../assets/icons/MdStarBorder.svg';
//Estilos del boton
import './MoodboardLikeButton.css';

//Propiedades que tiene el componente
interface MoodboardLikeButtonProps {
  ownerUsername: string;
  moodboardId: number;
  liked: boolean;
  likeCount: number;
  readOnly?: boolean;
  onChange?: (next: { liked: boolean; likeCount: number }) => void;
}

//Desestructuramos
export function MoodboardLikeButton({
  ownerUsername,
  moodboardId,
  //Indica si el usuario ya dio like (starred)
  liked,
  //Cantidad de estrellas
  likeCount,
  //Solo muestra la info
  readOnly = false,
  //Cuando cambia el like
  onChange,
}: MoodboardLikeButtonProps) {
  //Estado para saber si se esta procesando una peticion
  //Evita hacer varios click rapidos
  const [busy, setBusy] = useState(false);

  //Si liked = false y readOnly = false, entonces generara la clase para estilos moodboard-like-btn
  //Si liked es true se generara moodboard-like-btn moodboard-like-btn--active
  //Si readOnly=true --- moodboard-like-btn moodboard-like-btn--readonly
  const className = `moodboard-like-btn ${liked ? 'moodboard-like-btn--active' : ''} ${
    readOnly ? 'moodboard-like-btn--readonly' : ''
  }`.trim();

  //El icono se guarda en starIcon
  const starIcon = <img src={iconStar} alt="" draggable={false} />;

  //Si esta en modo lectura, no muestra el boton, osea visualmente pues ver la cantidad de likes pero no hace nada
  if (readOnly) {
    return (
      <span className={className} aria-label={`Me gusta: ${likeCount}`}>
        {starIcon}
        <span>{likeCount}</span>
      </span>
    );
  }

  //Al pulsar el boton se ejecuta esta funcion
  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    //Si ya esta procesando una peticion, no hara nada
    if (busy) {
      return;
    }

    //Bloque el boton actualizando su estado
    setBusy(true);
    //Llama al backend y hacemos la peticion post o delete depende de lo que hagamos, eso
    //suma + 1 o -1 al contador
    try {
      if (liked) {
        await unlikeMoodboard(ownerUsername, moodboardId);
        onChange?.({ liked: false, likeCount: Math.max(0, likeCount - 1) });
      } else {
        await likeMoodboard(ownerUsername, moodboardId);
        onChange?.({ liked: true, likeCount: likeCount + 1 });
      }
    } catch {
    
    } finally {
      setBusy(false);
    }
  };

  //Renderiza un boton starred
  return (
    <button
      type="button"
      className={className}
      //Mientras espera respuesta esta deshabilitado
      disabled={busy}
      //Indica si el boton esta activado
      aria-pressed={liked}
      aria-label={liked ? 'Quitar me gusta' : 'Me gusta'}
      //Si clico hare me gusta o se quitara
      onClick={(event) => void handleClick(event)}
    >
      {starIcon}
      <span>{likeCount}</span>
    </button>
  );
}
