import './SignUp.css';
import logo from './assets/Ediary.png';

export function SignUp() {
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
            </div>
        </>
    )
}