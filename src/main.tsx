import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Home } from './Home.tsx';
//import { SignUp } from './SignUp.tsx';
//import { SignIn } from './SignIn.tsx';
//import { ResetPassword } from './ResetPassword.tsx';

// Importación de la v2
//import { ChakraProvider } from '@chakra-ui/react'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Home/>
  </StrictMode>,
)

/**
 * createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </StrictMode>,
)
 */
