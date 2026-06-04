/** 
 * Se encarga de mostrar el feed de Explorar con las miniaturas de los moodboards 
 * 
 * Esto es lo que contiene MoodboardContent
 * export interface MoodboardContent {
  version: number;
  canvas?: MoodboardCanvasMeta;
  elements: MoodboardElement[];
} 

Esto es lo que contiene fetchThumbnailBlob
export function fetchMediaBlob(
  username: string,
  moodboardId: number,
  assetId: number,
  options: { auth?: boolean } = {},
): Promise<Blob> {
  return apiRequestBytes(mediaUrl(username, moodboardId, assetId), options);
}
  
MoodboarCardPreview en el componente de la vista previa del moodboard*/
import { useEffect, useRef, useState } from 'react';
import type { MoodboardContent } from '../types/api';
import { fetchThumbnailBlob } from '../api/moodboards';
import { MoodboardCardPreview } from './MoodboardCardPreview';

//Interfaz para la miniatura
interface FeedCardThumbnailProps {
  //Se debe mostrar el nombre del usuario que ha creado el moodboard, su propietario
  ownerUsername: string;
  //El id del moodboard
  moodboardId: number;
  //Indica si deberia existir una miniatura
  hasThumbnail: boolean;
  //contenido del moodboard (lo que has hecho ahi pero en pequeño, como un visual)
  content?: MoodboardContent;
}

//COMPONENTE MINIATURA
//Desestructuramos propiedades e indicamos su tipo
export function FeedCardThumbnail({
  ownerUsername,
  moodboardId,
  hasThumbnail,
  content,
}: FeedCardThumbnailProps) {
  //url del blob que se va a mostrar en <img> y su set para poder actualizarlo
  //Un blob es un Binary Large Object, un objeto que representa
  //un grupo de datos binarios, se usa para subir archivos o descargar imagenes etc, te puede proporcionar una URL temporal para previsualizar una imagen antes de subirse etc...
  //Si es null no hay imagen cargada
  const [src, setSrc] = useState<string | null>(null);
  //Controla si la miniatura fallo, osea si hasThumbnail es false, ya asume el fallo desde el inicio y aun no se genera ninguna miniatura
  const [thumbnailFailed, setThumbnailFailed] = useState(!hasThumbnail);
  //Para guardar posteriormente la URL creada con URL.createObjectURL
  //y luego liberarla
  const objectUrlRef = useRef<string | null>(null);

  //Cuando cambia hasThumbnail, ownerUsername, moodboardId, es decir alguna de las props,
  //se ejecuta el efecto
  useEffect(() => {

    //Si no hay miniatura, no carga nada, indica fallo directamente
    if (!hasThumbnail) {
      setSrc(null);
      setThumbnailFailed(true);
      return;
    }

    //Variable local para saber si el componente sigue montado o no
    let cancelled = false;
    //Para resetear porque por ejemplo si haces una primera carga y falla, pondra true, el moodboardId
    //tambien cambiara etc y cuando intentes meter una miniatura valida, seguiria en true y dando fallo, asi
    //que para permitir que la miniatura se monte, false
    setThumbnailFailed(false);

    //Funcion asincrona que se invoca inmediatamente (no despues)
    void (async () => {
      try {
        //Llama a la api y obtiene la imagen como blob
        const blob = await fetchThumbnailBlob(ownerUsername, moodboardId);
        //Si el componente se demsonta, no se actualiza
        if (cancelled) {
          return;
        }
        //Limpieza de URLs
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        //Recogemos la URL del Blob y la asignamos a una variable tipo string para usarla luego en <img>
        const objectUrl : string = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        //Actualizamos el src
        setSrc(objectUrl);
        //Actualizamos el estado de la miniatura
        setThumbnailFailed(false);
      } catch {
        //Si la api falla, no hay ni imagen ni miniatura de nada
        if (!cancelled) {
          setSrc(null);
          setThumbnailFailed(true);
        }
      }
    })();

    //RENDERIZADO
    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [hasThumbnail, ownerUsername, moodboardId]);

  if (src) {
    return (
      <div className="dashboard-card-preview" aria-hidden>
        <img src={src} alt="" />
      </div>
    );
  }

  if (content && thumbnailFailed) {
    return (
      <MoodboardCardPreview
        content={content}
        ownerUsername={ownerUsername}
        moodboardId={moodboardId}
      />
    );
  }

  return (
    <div
      className="dashboard-card-preview dashboard-card-preview--empty"
      aria-hidden
    />
  );
}
