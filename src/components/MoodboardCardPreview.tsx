//Este componente se encarga de generar una miniatura o previsualizacion
//de un moodboard creado con Fabric.js y mostrarla como una imagen dentro de una tarjeta
//(Esa tarjeta es FeedCardThumbnail.tsx)

//Importamos la clase principal de fabric que es Canvas
import { Canvas } from 'fabric';
import { useEffect, useState } from 'react';

//Importa el tipo que representa el contenido de un moodboard
import type { MoodboardContent } from '../types/api';

//Importamos la altura y ancho del canvas por defecto, y el JSON de Fabric almacenado en el moodboard
//Lo ultimo se consigue a partir de la funcion extractFabricJson
//la cual permite al objeto fabricJson dentro del componente createEmptyMoodboardContent 
// de tipo MoodboardContent asignar valor a sus props
//Y este a su vez es un elemento mas dentro del array elements
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  extractFabricJson,
} from '../lib/moodboardContent';

//Importa esta funcion de ese archivo. Esta funcion en resumen prepara una
//copia del JSON de Fabric y reemplaza los recursos multimedia antes de que Fabric los cargue en el Canvas
import { hydrateFabricMedia } from '../fabric/mediaAssets';

//El componente va a recibir el contenido completo del moodboard
//El usuario propietario y el id del moodboard
interface MoodboardCardPreviewProps {
  content: MoodboardContent;
  ownerUsername: string;
  moodboardId: number;
}

//COMPONENTE del tipo de la interfaz superior
export function MoodboardCardPreview({
  content,
  ownerUsername,
  moodboardId,
}: MoodboardCardPreviewProps) {
  //Aqui se guarda la imagen generada
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  //Busca el background del canvas, para el fondo. Si no existe, busca el background dentro
  //del JSON de Fabric y si no lo pone blanco
  const background =
    content.canvas?.background ??
    (typeof extractFabricJson(content)?.background === 'string'
      ? (extractFabricJson(content)?.background as string)
      : '#ffffff');

  //Se ejecuta cuando cambia content, ownerUsername, moodboardId o background
  useEffect(() => {
    //Variable local auxiliar para ver si el componente sigue montado o no
    let cancelled = false;
    //Aqui guardamos las URLs temporales creadas para imagenes
    const blobUrls: string[] = [];

    //Funcion asincrona que se ejecuta en el momento (IIFE segun mouredev)
    (async () => {
      //Extraemos el JSON Fabric, si no hay JSON pues no hace nada
      const rawJson = extractFabricJson(content);
      if (!rawJson) {
        return;
      }

      //Creamos un canvas oculto
      const canvasEl = document.createElement('canvas');
      //Obtenemos las dimensiones del canvas
      const width = content.canvas?.width ?? CANVAS_WIDTH;
      const height = content.canvas?.height ?? CANVAS_HEIGHT;

      //Instanciamos el canvas (temporal), con sus dimensiones, el fondo...
      const canvas = new Canvas(canvasEl, {
        width,
        height,
        backgroundColor: background,
        //Desactiva seleccion de objetos
        selection: false,
        //Evita escalar por DPI
        enableRetinaScaling: false,
      });

      try {
        const hydrated = await hydrateFabricMedia(
          //Pasamos por la funcion el JSON del canvas
          rawJson,
          //Nombre del usuario
          ownerUsername,
          //Id moodboards
          moodboardId,
          //Las URLs de las imagenes
          blobUrls,
        );
        //Si no hay imagenes no renderiza nada
        if (cancelled) {
          return;
        }

        //Reconstruimos todo el moodboard
        await canvas.loadFromJSON(hydrated);
        //Y renderizamos todos sus elementos
        canvas.renderAll();

        //Transforma el canvas completo en una imagen en formato jpeg etc...
        const dataUrl = canvas.toDataURL({
          format: 'jpeg',
          quality: 0.82,
          multiplier: Math.min(1, 400 / width),
        });

        //Se guarda la preview
        if (!cancelled) {
          setPreviewSrc(dataUrl);
        }
      } catch {
        //Si algo falla la previa es null
        if (!cancelled) {
          setPreviewSrc(null);
        }
      } finally {
        //Limpieza
        //Destruye el canvas
        void canvas.dispose();
        //Elimina blobs temporales
        for (const url of blobUrls) {
          URL.revokeObjectURL(url);
        }
      }
    })();

    //Limpieza el useEffect, cuando el componente se desmonta cancelled = true
    return () => {
      cancelled = true;
    };
  }, [content, ownerUsername, moodboardId, background]);

  //RENDERIZADO
  return (
    //Contenedor
    <div
      className="dashboard-card-preview"
      aria-hidden
      //por si la imagen aun no ha cargado
      style={{ backgroundColor: background }}
    >
      {/**Mostramos la imagen previa */}
      {previewSrc && <img src={previewSrc} alt="" />}
    </div>
  );
}
