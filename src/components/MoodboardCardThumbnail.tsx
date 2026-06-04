//Importa el tipo que representa el contenido de un moodboard
import type { MoodboardContent } from '../types/api';
//La caja de la miniatura del moodboard
import { FeedCardThumbnail } from './FeedCardThumbnail';
//La imagen previa del moodboard que aparecera en la miniatura
import { MoodboardCardPreview } from './MoodboardCardPreview';

//Vamos a montar la miniatura en funcion de los datos que reciba
interface MoodboardCardThumbnailProps {
  ownerUsername: string;
  moodboardId: number;
  //Si existe una miniatura guardada
  hasThumbnail: boolean;
  //Puede haber contenido o estar vacio
  content?: MoodboardContent;
}

//Desestructuracion de las propiedades para obtenerlas
export function MoodboardCardThumbnail({
  ownerUsername,
  moodboardId,
  hasThumbnail,
  content,
}: MoodboardCardThumbnailProps) {
  //Si existe una miniatura, la renderiza 
  if (hasThumbnail) {
    return (
      <FeedCardThumbnail
        ownerUsername={ownerUsername}
        moodboardId={moodboardId}
        hasThumbnail
        content={content}
      />
    );
  }

  //Si hay contenido renderiza una vista previa
  if (content) {
    return (
      <MoodboardCardPreview
        content={content}
        ownerUsername={ownerUsername}
        moodboardId={moodboardId}
      />
    );
  }
  //Si no tiene ni miniatura ni contenido renderiza un div vacio
  return (
    <div
      className="dashboard-card-preview dashboard-card-preview--empty"
      aria-hidden
    />
  );
}
