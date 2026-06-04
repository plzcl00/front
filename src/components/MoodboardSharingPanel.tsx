//Importacion de hooks de React
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Moodboard } from '../types/api';
//Funciones que llaman al backend, peticiones http
/** GET, GET, POST, DELETE, PUT*/
import {
  getLikeCount,
  getLikes,
  getPermissions,
  grantPermission,
  revokePermission,
  setVisibility,
} from '../api/moodboards';
//Componentes importados
//Hooks que controlan la sesion
import { useOptionalSession } from '../auth/useSession';
//Boton de Likes
import { MoodboardLikeButton } from './MoodboardLikeButton';
//Campo que sugiere usuarios existentes
import { UsernameAutocomplete } from './UsernameAutocomplete';
import './MoodboardSharingPanel.css';

//Props
interface MoodboardSharingPanelProps {
  //Toda la info del moodboard
  moodboard: Moodboard;
  //Si el usuario actual es el propietario
  isOwner: boolean;
  //Funcion para avisar cuando el moodboard cambia
  onMoodboardUpdate: (board: Moodboard) => void;
}

//COMPONENTE - Es la opcion para "compartir", dar acceso a un user a tu tablero
export function MoodboardSharingPanel({
  moodboard,
  isOwner,
  onMoodboardUpdate,
}: MoodboardSharingPanelProps) {
  const { session } = useOptionalSession();
  //Usuario al que se dara acceso
  const [grantTo, setGrantTo] = useState('');
  //Usuario valido o invalido, para saber si el usuario escrito existe
  const [grantToValid, setGrantToValid] = useState(false);
  //Usuarios autorizados
  const [grantedUsers, setGrantedUsers] = useState<string[]>([]);
  //Usuarios que dieron like
  const [likers, setLikers] = useState<string[]>([]);
  //Cantidad de likes
  const [likeCount, setLikeCount] = useState(moodboard.likeCount ?? 0);
  //Para mostrar errores
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  //Dueño del moodboard
  const owner = moodboard.ownerUsername;
  //id del moodboard
  const id = moodboard.id;
  //Usuario actualmente autenticado
  const currentUser = session?.username ?? '';

  //Funcion que actualiza toda la informacion de los likes
  const refreshLikes = useCallback(async () => {
    const [count, list] = await Promise.all([
      getLikeCount(owner, id),
      getLikes(owner, id),
    ]);
    setLikeCount(count);
    setLikers(list);
  }, [owner, id]);

  //Cuando se monta el componente obtenemos el numero de likes y quienes dieron like
  //Si falla usa valores por defecto
  useEffect(() => {
    void refreshLikes().catch(() => {
      setLikeCount(moodboard.likeCount ?? 0);
      setLikers([]);
    });
  }, [refreshLikes, moodboard.likeCount]);

  //Solo se ejecuta si es el propietario
  useEffect(() => {
    if (!isOwner) {
      return;
    }
    //Obtiene los usuarios autorizados y los guarda
    void getPermissions(owner, id)
      .then(setGrantedUsers)
      .catch(() => setGrantedUsers([]));
  }, [isOwner, owner, id]);

  //Para saber si el usuario actual ha dado like
  const userHasLiked = likers.includes(currentUser);

  //Para cambiar la visibilidad, si es privado o publico
  const handleVisibility = async () => {
    setBusy(true);
    setError(null);
    try {
      //Si es privado lo vuelve publico
      const updated = await setVisibility(owner, id, !moodboard.isPublic);
      //Avisa al padre
      onMoodboardUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  //Se ejecuta al enviar el formulario para conceder acceso a otro suaurio o no
  const handleGrant = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = grantTo.trim();
    if (!username || !grantToValid) return;
    setBusy(true);
    setError(null);
    try {
      await grantPermission(owner, id, username);
      //Actualiza la lista
      setGrantedUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username],
      );
      //Limpia el formu
      setGrantTo('');
      setGrantToValid(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  //Para revocar / rechazar el acceso
  const handleRevoke = async (username: string) => {
    setBusy(true);
    setError(null);
    try {
      await revokePermission(owner, id, username);
      setGrantedUsers((prev) => prev.filter((u) => u !== username));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  //RENDERIZADO
  return (
    <aside className="sharing-panel">
      <h3>Compartir y social</h3>
      {/**Solo aparece si existe un error */}
      {error && (
        <p className="sharing-error" role="alert">
          {error}
        </p>
      )}

      <p>
        {/**Muestra "Publico o Privado" */}
        Visibilidad:{' '}
        <strong>{moodboard.isPublic ? 'Público' : 'Privado'}</strong>
      </p>

      {/**Esto solo lo ve el dueño */}
      {isOwner && (
        <>
          {/**Permite cambiar a privado o publico */}
          <button type="button" disabled={busy} onClick={() => void handleVisibility()}>
            {moodboard.isPublic ? 'Hacer privado' : 'Hacer público'}
          </button>

          {/**Formulario de compartir / dar acceso */}
          <form onSubmit={(e) => void handleGrant(e)} className="sharing-grant-form">
            <label htmlFor="grantTo">Dar acceso a usuario</label>
            <UsernameAutocomplete
              id="grantTo"
              value={grantTo}
              onChange={setGrantTo}
              onValidUserChange={setGrantToValid}
              exclude={[owner, currentUser, ...grantedUsers]}
              disabled={busy}
              placeholder="nombre_usuario"
            />
            <button type="submit" disabled={busy || !grantToValid}>
              Conceder
            </button>
          </form>

          {/**Lista de usuarios autorizados y puedes revocarle el acceso a cada usuario, se genera un boton de revocacion por cada uno */}
          {grantedUsers.length > 0 && (
            <ul className="sharing-granted-list">
              {grantedUsers.map((u) => (
                <li key={u}>
                  {u}{' '}
                  <button type="button" disabled={busy} onClick={() => void handleRevoke(u)}>
                    Revocar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/**Boton de like, reutilizando componente */}
      <div className="sharing-like-row">
        <MoodboardLikeButton
          ownerUsername={owner}
          moodboardId={id}
          liked={userHasLiked}
          likeCount={likeCount}
          //Al ser propietario no puede darse like asi mismo
          readOnly={isOwner || !currentUser}
          //Se actualiza el contador cuando el user da like
          onChange={(next) => {
            setLikeCount(next.likeCount);
            void refreshLikes();
          }}
        />
      </div>
      {/**Mostrar quien dio like */}
      {likers.length > 0 && (
        <p className="sharing-likers">Les gusta: {likers.join(', ')}</p>
      )}
    </aside>
  );
}
