import './Home.css';
import imagenMuestra from './assets/imagen-muestra.jpg';
import logo from './assets/Ediary.png';
import imagenDecoracion from './assets/processing.svg';

export function Home() {

  return (
    <>
      {/*Header*/}
      <header>
        <img className='logo' src={logo} alt='logo' />
        <div className='botones-encabezado'>
          <button type="submit" className="btn-idioma">Idioma</button>
          <button type="submit" className="btn-registro">Registrarse</button>
          <button type="submit" className="btn-inicio-sesion">Iniciar sesión</button>
        </div>
      </header>

      {/*Contenido de la página va aquí abajo*/}
      <div className="contenido-pagina">
        <div className='bienvenida'>
          <h1>Expresa tus emociones y explora.</h1>
          <p>Encuentra un lugar para tus pensamientos.</p>
          <div>
            <img className="imagen-muestra1" src={imagenMuestra} alt="imagen-muestra" />
          </div>
          <hr />
        </div>

        <div className='bienvenida'>
          <h1>Escribe lo que sientes en tu diario.</h1>
          <p>Puedes representar sentimientos, tu estado de ánimo, ideas del día a día a través
            de anotaciones, gráficos y hasta vídeos.
          </p>
          <div>
            <img className="imagen-muestra1" src={imagenMuestra} alt="imagen-muestra" />
          </div>
          <hr />
        </div>

        <div className='bienvenida'>
          <h1>Conócete a ti mismo.</h1>
          <p>Mediante quiz diarios, E-Diary es capaz de generar métricas que te ayudarán
            a comprenderte y mejorar hábitos.
          </p>
          <div>
            <img className="imagen-muestra1" src={imagenMuestra} alt="imagen-muestra" />
          </div>
          <hr />
        </div>

        <div className='bienvenida'>
          <h1>Organiza tu agenda.</h1>
          <p>Gestiona eventos a través de nuestro calendario. E-Diary te notificará de los
            próximos planes.
          </p>
          <div>
            <img className="imagen-muestra1" src={imagenMuestra} alt="imagen-muestra" />
          </div>
          <hr />
        </div>

        <div className='bienvenida2'>
          <div className='sub-bienvenida1'>
            <img className="imagen-muestra2" src={imagenMuestra} alt="" />
          </div>
          <div className='sub-bienvenida2'>
            <h1>App para pc.</h1>
            <p>Estamos trabajando para que tengas la mejor experiencia en cualquier dispositivo.</p>
          </div>
        </div>

        <div className='decoracion'>
          {/**Formulario */}
          <div className="form-container">
            <h2>Bienvenido a EDiary</h2>
            <p>Descúbrete a ti mismo.</p>

            <form action="#" method="POST">
              <div className="form-group">
                <label htmlFor="nombre">Correo Electrónico</label>
                <input type="text" id="nombre" name="nombre" required />
              </div>

              <div className="form-group">
                <label htmlFor="email">Contraseña</label>
                <input type="email" id="email" name="email" required />
                <p>Debe tener al menos 8 carácteres, números y símbolos especiales.</p>
              </div>

              <div className="form-group">
                <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                <input
                  type="date"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  required
                />
              </div>

              <div className="form-group-checkbox">
                <input type="checkbox" id="terminos" name="terminos" required />
                <label htmlFor="terminos">
                  Acepto los <a href="/terminos" target="_blank">Términos de servicio</a> y la <a href="/privacidad" target="_blank">Política de privacidad</a>
                </label>
              </div>

              <button type="submit" className="btn-registro-form">Registrarse</button>

              <p>¿Ya tienes una cuenta?
                <a href=""> Iniciar sesión.</a>
              </p>
            </form>
          </div>
          <img src={imagenDecoracion} alt="processing" />
        </div>
      </div>

      {/**Footer */}
      <footer>
        <img className="logo" src={logo} alt="logo" />
        <div className='footer-terminos'>
          <p>Términos de uso</p>
          <p>Política de Privacidad</p>
          <p>Soporte</p>
          <p>Contacto</p>
        </div>
      </footer>
    </>
  )
}
