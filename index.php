<?php 
include 'includes/header.php'; 
// Mantenemos los datos cargados por si los necesitas en la home
include 'includes/datos_proyectos.php';
include 'includes/datos_servicios.php';
?>

<main>
    <!-- Hero Principal -->
    <section class="hero">
        <div class="hero-content">
            <h2>Hacia la Industria 4.0</h2>
            <p>La unión perfecta entre el mecanizado de precisión y la fabricación aditiva.</p>
        </div>
    </section>
</main>

    <!-- Selector de Mundos -->
    <section class="selector-mundos">
        <div class="intro-texto">
            <h3>Bienvenido al Hub de Manufactura Avanzada</h3>
            <p>Seleccioná el área en la que podemos ayudarte hoy:</p>
        </div>

        <div class="contenedor-opciones">
            <!-- Opción SolGia -->
            <div class="opcion-card solgia-bg">
                <div class="overlay">
                    <h3>SolGia</h3>
                    <p>Consultoría Industrial & Capacitación CNC</p>
                    <a href="#solgia" class="btn-opcion">Ver Soluciones CNC</a>
                </div>
            </div>

            <!-- Opción Tu Mundo 3D -->
            <div class="opcion-card mundo3d-bg">
                <div class="overlay">
                    <h3>Tu Mundo 3D</h3>
                    <p>Diseño en NX 10 & Impresión 3D Profesional</p>
                    <a href="#galeria" class="btn-opcion">Ver Proyectos 3D</a>
                </div>
            </div>
        </div>
    </section>

    <section id="perfil" class="seccion-perfil">
    <div class="contenedor-perfil">
        <div class="foto-perfil">
            <!-- Aquí iría una foto tuya trabajando con el CNC o la impresora -->
            <img src="img/mi_foto.png" alt="Perfil Profesional">
        </div>
        <div class="texto-perfil">
            <h2>Trayectoria Profesional</h2>
            <p><strong>Programador y Operador de CNC</strong> con más de 20 años de experiencia en la industria metalúrgica.</p>
            <p>Especialista en controles Fanuc, ISO y diseño avanzado en <strong>Siemens NX 10</strong>. Actualmente cursando Diplomatura en <strong>Industria 4.0 (UTN)</strong> para liderar la transformación digital en talleres y fábricas.</p>
            
            <div class="skills">
                <span>#CNC</span> <span>#NX10</span> <span>#Impresion3D</span> <span>#Industria4.0</span> <span>#DocenciaTecnica</span>
            </div>
            
            <a href="Gustavo Soler2026.pdf" class="btn-cv" target="_blank">Descargar CV (PDF)</a>
        </div>
    </div>
</section>


    <section id="galeria" class="contenedor-galeria">

    <h2 class="titulo-seccion">Portfolio Tu Mundo 3D</h2>

    <div class="grid-galeria">

        <?php foreach ($proyectos as $proyecto): ?>

            <div class="proyecto-card">

                <img src="<?php echo $proyecto['imagen']; ?>" alt="<?php echo $proyecto['titulo']; ?>">

                <div class="proyecto-info">

                    <span class="categoria"><?php echo $proyecto['categoria']; ?></span>

                    <h3><?php echo $proyecto['titulo']; ?></h3>

                    <p><?php echo $proyecto['descripcion']; ?></p>

                </div>

            </div>

        <?php endforeach; ?>

    </div>

</section>







<section id="solgia" class="seccion-solgia">

<div class="contenedor-info">
        <span class="badge">Consultoría Industrial</span>
        <h2 class="titulo-seccion">SolGia: Potenciando la Productividad</h2>
        <p class="subtitulo">
            Más de 20 años de experiencia técnica  al servicio de la formación 
            y la optimización de procesos CNC. 
        </p>
       

        <div class="grid-servicios">

            <?php foreach ($servicios_solgia as $servicio): ?>

                <div class="servicio-card">

                    <div class="icono"><?php echo $servicio['icono']; ?></div>

                    <h3><?php echo $servicio['titulo']; ?></h3>

                    <p><strong><?php echo $servicio['descripcion']; ?></strong></p>

                    <p class="detalle"><?php echo $servicio['detalle']; ?></p>

                </div>

            <?php endforeach; ?>

        </div>
        <div class="franja-experiencia">
            <div class="dato">
                <h4>+20 Años</h4>
                <p>En el Sector Metalmecánico </p>
            </div>
            <div class="dato">
                <h4>Expertise</h4>
                <p>Fanuc, Siemens, Fagor</p>
            </div>
            <div class="dato">
                <h4>Software</h4>
                <p>NX 10, CAMWorks, SolidWorks</p>
            </div>
        </div>

    </div>

</section>

<section id="recursos" class="seccion-recursos">
    <div class="contenedor-info">
        <h2 class="titulo-seccion">Recursos para Alumnos</h2>
        <p class="subtitulo">Material técnico exclusivo para potenciar tu formación en el taller.</p>
        
        <div class="grid-recursos">
            <div class="recurso-card">
                <i class="fas fa-file-pdf"></i>
                <h3>Guías y Tablas</h3>
                <p>Descargá tablas de avances, velocidades y manuales de programación Fanuc/Siemens.</p>
                <a href="docs/guia-tecnica-solgia.pdf" class="btn-descarga">Ver Archivos</a>
            </div>

            <div class="recurso-card">
                <i class="fas fa-play-circle"></i>
                <h3>Video Tutoriales</h3>
                <p>Tips rápidos al pie de máquina y demostraciones de mecanizado CNC.</p>
                <a href="#" class="btn-descarga">Ir al Canal</a>
            </div>

            <div class="recurso-card">
                <i class="fas fa-lightbulb"></i>
                <h3>Consejos de Experto</h3>
                <p>Secretos de puesta a punto y resolución de problemas tras 20 años en el sector.</p>
                <a href="#seccion-consejos-detalle" class="btn-descarga">Leer Tips</a>
            </div>
        </div>

        <div id="seccion-consejos-detalle" class="grid-consejos-dinamico" style="margin-top: 50px;">
            </div>
        </div>
    </div>
</section>


<section class="seccion-apoyo">
    <div class="contenedor-info">
        <div class="card-apoyo">
            <div class="icono-apoyo"><i class="fas fa-mug-hot"></i></div>
            <h3>¿Te resultó útil el contenido?</h3>
            <p>
                Tu colaboración me ayuda a seguir adquiriendo insumos para la <strong>Ender 3 V3 SE</strong> 
                y a dedicar tiempo a crear más guías técnicas de CNC e Industria 4.0 para la comunidad.
            </p>
            <div class="contenedor-botones-pago">
                <a href="https://mpago.la/26SWLMr" class="btn-pago btn-cafecito" target="_blank" rel="noopener">
                    <i class="fas fa-coffee"></i> Invitar un Cafecito
                </a>
                <a href="TU_LINK_DE_MP" class="btn-pago btn-mercadopago" target="_blank" rel="noopener">
                    <i class="fas fa-credit-card"></i> Mercado Pago
                </a>
            </div>
            <p class="nota-agradecimiento">¡Gracias por apoyar el crecimiento de <strong>Tu Mundo 3D</strong> y <strong>SolGia</strong>!</p>
        </div>
    </div>
</section>

<!-- Botón Flotante de WhatsApp -->
<a href="https://wa.me/5493413145782?text=Hola!%20Vi%20tu%20web%20Industria%204.0.%20Me%20interesa%20consultar%20por:" 
   class="whatsapp-float" 
   target="_blank" 
   rel="noopener noreferrer">
    <i class="fab fa-whatsapp"></i>
    <span class="tooltip-wa">¿Consultas? Escribime</span>
</a>


<div id="modal-consejos" class="modal">
    <div class="modal-contenido">
        <span class="cerrar-modal">&times;</span>
        <div id="contenido-dinamico-consejos">
            </div>
    </div>
</div>

<!-- Iconos de FontAwesome (para el logo de WhatsApp) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">

    <!-- Aquí abajo podés mantener las secciones ocultas o que aparezcan al scrollear -->
    <!-- ... tu código de Galería y SolGia ... -->

<script src="js/consejos.js"></script>


<?php include 'includes/footer.php'; ?>