import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { ResetPassword } from './ResetPassword';
import { Home } from './Home';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { Dashboard } from './pages/Dashboard';
import { MoodboardEditorPage } from './pages/MoodboardEditorPage';
import { MoodboardViewPage } from './pages/MoodboardViewPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SettingsPage } from './pages/SettingsPage';
import './App.css';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Dashboard />
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
            element={<Navigate to="/app" replace />}
          />
          <Route
            path="/app/moodboards/:id"
            element={
              <ProtectedRoute>
                <MoodboardEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/u/:username/moodboards/:id"
            element={
              <ProtectedRoute>
                <MoodboardViewPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
