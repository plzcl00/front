import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createMoodboard } from '../api/moodboards';
import { useSession } from '../auth/useSession';
import { createEmptyMoodboardContent } from '../lib/moodboardContent';
import { AppShell } from '../components/AppShell';

export function NewMoodboardPage() {
  const { username } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const created = await createMoodboard(username, createEmptyMoodboardContent());
        if (!cancelled) {
          navigate(`/app/moodboards/${created.id}`, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo crear el moodboard');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, username]);

  return (
    <AppShell title="Nuevo moodboard">
      {error ? (
        <>
          <p className="dashboard-error" role="alert">
            {error}
          </p>
          <Link to="/app">Volver al panel</Link>
        </>
      ) : (
        <p className="dashboard-status">Creando moodboard…</p>
      )}
    </AppShell>
  );
}
