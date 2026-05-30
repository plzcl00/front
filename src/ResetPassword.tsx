import './ResetPassword.css';
import logo from './assets/Ediary.png';

export function ResetPassword() {
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
                    <h2>Reestablecer contraseña</h2>
                    <p></p>

                    <form action="#" method="POST">
                        <div className="form-group">
                            <label htmlFor="nombre">Correo Electrónico</label>
                            <input type="text" id="nombre" name="nombre" required />
                        </div>

                        <button type="submit" className="btn-registro-form">Restablecer contraseña</button>

                        <p>Volver al
                            <a href=""> Incio.</a>
                        </p>
                         <p>Volver a enviar
                            <a href=""> link de reestablecimiento.</a>
                        </p>
                    </form>
                </div>
            </div>
        </>
    )
}