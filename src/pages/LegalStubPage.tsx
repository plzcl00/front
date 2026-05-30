import { Link } from 'react-router-dom';
import { MarketingHeader } from '../components/MarketingHeader';
import { Footer } from '../components/Footer';

interface LegalStubPageProps {
  title: string;
}

export function LegalStubPage({ title }: LegalStubPageProps) {
  return (
    <>
      <MarketingHeader />
      <div className="contenido-pagina contenido-pagina--auth">
        <div className="form-container card card--elevated">
          <h2>{title}</h2>
          <p>Contenido próximamente.</p>
          <Link to="/" className="btn-registro-form">
            Volver al inicio
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
