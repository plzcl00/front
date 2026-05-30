import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { SearchProvider } from './search/SearchContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Home } from './Home';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { Dashboard } from './pages/Dashboard';
import { MoodboardEditorPage } from './pages/MoodboardEditorPage';
import { MoodboardViewPage } from './pages/MoodboardViewPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ExplorePage } from './pages/ExplorePage';
import { SettingsPage } from './pages/SettingsPage';
import { NewMoodboardPage } from './pages/NewMoodboardPage';
import { LegalStubPage } from './pages/LegalStubPage';
import './App.css';

export function App() {
  return (
    <AuthProvider>
      <SearchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/terminos" element={<LegalStubPage title="Términos de servicio" />} />
          <Route path="/privacidad" element={<LegalStubPage title="Política de privacidad" />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/explorar"
            element={
              <ProtectedRoute>
                <ExplorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/favoritos"
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/ajustes"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/moodboards/new"
            element={
              <ProtectedRoute>
                <NewMoodboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/moodboards/:id"
            element={
              <ProtectedRoute>
                <MoodboardEditorPage />
              </ProtectedRoute>
            }
          />
          <Route path="/u/:username/moodboards/:id" element={<MoodboardViewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SearchProvider>
    </AuthProvider>
  );
}
