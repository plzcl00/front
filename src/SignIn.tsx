import './SignIn.css';
import logo from './assets/Ediary.png';

export function SignIn() {
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

            {/**Formulario */}
            <div className='contenido-pagina'>
                <div className="form-container">
                    <h2>Accede a EDiary</h2>
                    <p></p>

                    <form action="#" method="POST">
                        <div className="form-group">
                            <label htmlFor="nombre">Correo Electrónico</label>
                            <input type="text" id="nombre" name="nombre" required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Contraseña</label>
                            <input type="email" id="email" name="email" required />
                            <a className="contrasenia-olvidada" href=''>¿Has olvidado tu contraseña?</a>
                        </div>

                        <button type="submit" className="btn-registro-form">Iniciar Sesión</button>

                        <p>¿No tienes una cuenta?
                            <a href=""> Regístrate.</a>
                        </p>
                    </form>
                </div>
            </div>
        </>
    )
}