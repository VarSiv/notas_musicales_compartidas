<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';

    const colorGenero = d3.scaleOrdinal()
        .domain(["Pop", "Rock", "Indie", "Electrónica", "Reguetón", "Rap", "Personalizado"])
        .range(["#00CC66", "#CC0000", "#CC0066", "#001BCC", "#CCB400", "#000000", "#FF6600"]);

    const escalaReproducciones = d3.scaleLinear()
        .domain([0, 100])
        .range([50, 150]);

    const simboloSelector = {
        "Auricular": "🎧",
        "Microfono": "🎤",
        "Guitarra": "🎸",
        "Teclado": "🎹"
    };

    let tuNombre = '';
    let generoSeleccionadoColor = 'Pop';
    let simboloSeleccionadoPersonalizado = 'Auricular';
    let usarSimboloAleatorio = false;
    let colorPersonalizado = '#FF6600';
    let miPlaylistPersonalizada = [];

    const clientId = "61bec06018814bb79adb1b19274cf718";
    const clientSecret = "26348aa8d38641f4b5f5f8fb0ce66334";
    const redirectUri = "https://visualizacion-final-sigma.vercel.app/";

    function loginWithSpotify() {
        const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=user-top-read`;
        window.location.href = url;
    }

    async function authenticateUser(code) {
        const body = new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret
        });

        const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body
        });

        const data = await res.json();

        if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            getTopTracks(data.access_token);
        } else {
            alert("No se pudo obtener el token. Intenta de nuevo.");
        }
    }

    async function getTopTracks(token) {
        const res = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=3", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.items) {
            miPlaylistPersonalizada = data.items.map(track => ({
                id: track.id,
                nombre: track.name,
                artista: track.artists.map(a => a.name).join(", "),
                decada: track.album.release_date ? `${Math.floor(parseInt(track.album.release_date.substring(0,4))/10)*10}s` : "Desconocida",
                reproducciones: track.popularity,
                generos: generoSeleccionadoColor,
                eligio: usarSimboloAleatorio ? getRandomSimbolo() : simboloSelector[simboloSeleccionadoPersonalizado],
                creador: tuNombre || "Anónimo"
            }));
        }
    }

    function getColorForGenre(genre) {
        return genre === 'Personalizado' ? colorPersonalizado : colorGenero(genre);
    }

    function getRandomSimbolo() {
        const keys = Object.keys(simboloSelector);
        return simboloSelector[keys[Math.floor(Math.random() * keys.length)]];
    }

    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
            authenticateUser(code);
        } else {
            const token = localStorage.getItem("access_token");
            if (token) getTopTracks(token);
        }
    });

</script>

<div class="reproductor-container">
    <h2>🎵 Tu Reproductor Musical</h2>
    <button on:click={loginWithSpotify}>Conectar con Spotify</button>

    <div class="formulario">
        <input type="text" bind:value={tuNombre} placeholder="Tu nombre" />
        <select bind:value={generoSeleccionadoColor}>
            {#each colorGenero.domain() as genero}
                <option value={genero}>{genero}</option>
            {/each}
        </select>
        {#if generoSeleccionadoColor === 'Personalizado'}
            <input type="color" bind:value={colorPersonalizado} />
        {/if}
        <label>
            <input type="checkbox" bind:checked={usarSimboloAleatorio} /> Símbolo aleatorio
        </label>
        <div class="simbolos">
            {#each Object.keys(simboloSelector) as simbolo}
                <label>
                    <input type="radio" bind:group={simboloSeleccionadoPersonalizado} value={simbolo} disabled={usarSimboloAleatorio}/>
                    {simboloSelector[simbolo]}
                </label>
            {/each}
        </div>
    </div>
    {#if miPlaylistPersonalizada.length > 0}
    <h3>Top 3 de Spotify</h3>
    <div class="playlist">
        {#each miPlaylistPersonalizada as cancion}
            <div class="card" style="border-color: {getColorForGenre(cancion.generos)};">
                <div class="circle" style="background-color: {getColorForGenre(cancion.generos)};">
                    <span class="num">{cancion.eligio}</span>
                    <div class="wave {enReproduccion === cancion.id ? 'animando' : ''}"></div>
                    <div class="controles">
                        {#if cancion.preview_url}
                            <button on:click={() => reproducir(cancion)}>
                                {enReproduccion === cancion.id ? "⏸ Pausar" : "▶ Escuchar preview"}
                            </button>
                        {:else}
                            <small>No hay preview disponible</small>
                        {/if}
                    </div>
                </div>
                <div class="info">
                    <strong>{cancion.nombre}</strong><br />
                    <small>{cancion.artista}</small><br />
                    <small>Elegido por: {cancion.creador}</small>
                </div>
            </div>
        {/each}
     </div>
{/if}
</div>

<style>
/* Importar una fuente moderna de Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

body {
    font-family: 'Inter', sans-serif; /* Aplicar la nueva fuente */
    background-color: #e0e0e0; /* Un fondo más suave */
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh; /* Para centrar verticalmente el contenedor principal */
}

.reproductor-container {
    max-width: 900px; /* Aumentar el ancho máximo */
    width: 95%; /* Que ocupe casi todo el ancho disponible en pantallas pequeñas */
    margin: 40px auto; /* Más margen para separar del borde */
    padding: 35px; /* Más padding interno */
    background: #ffffff; /* Blanco puro para un look más limpio */
    border-radius: 20px; /* Bordes más redondeados */
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); /* Sombra más suave y extendida */
    position: relative; /* Necesario para posibles animaciones */
    overflow: hidden; /* Asegurar que los elementos internos no se desborden */
}

h2 {
    color: #2c3e50; /* Un azul más oscuro y moderno */
    margin-bottom: 25px;
    font-size: 2.2em; /* Título más prominente */
    font-weight: 700;
}

h3 {
    color: #34495e;
    margin-top: 40px;
    margin-bottom: 25px;
    font-size: 1.8em;
    font-weight: 600;
}

button {
    padding: 12px 28px;
    background: linear-gradient(45deg, #1DB954, #1ED760); /* Gradiente para el botón de Spotify */
    color: white;
    border: none;
    border-radius: 30px; /* Bordes más redondeados para los botones */
    margin-bottom: 30px;
    cursor: pointer;
    font-size: 1.1em;
    font-weight: 600;
    transition: all 0.3s ease; /* Transición suave al pasar el mouse */
    letter-spacing: 0.5px;
    box-shadow: 0 4px 15px rgba(29, 185, 84, 0.3);
}

button:hover {
    transform: translateY(-2px); /* Pequeño efecto de levantamiento */
    box-shadow: 0 6px 20px rgba(29, 185, 84, 0.4);
}

.formulario {
    margin-bottom: 30px;
    display: flex;
    flex-wrap: wrap; /* Para que los elementos se adapten a la línea */
    justify-content: center;
    gap: 15px; /* Espacio entre los elementos del formulario */
    padding: 15px;
    border-radius: 10px;
    background-color: #f8f8f8; /* Un fondo ligeramente diferente para el formulario */
    box-shadow: inset 0 0 8px rgba(0,0,0,0.05);
}

input[type="text"],
select,
input[type="color"] {
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 8px; /* Bordes redondeados para inputs y selects */
    font-size: 1em;
    transition: border-color 0.3s ease;
    flex-grow: 1; /* Para que ocupen el espacio disponible */
    max-width: 250px; /* Ancho máximo para inputs */
}

input[type="text"]:focus,
select:focus,
input[type="color"]:focus {
    border-color: #1DB954; /* Resaltar al enfocar */
    outline: none;
}

.formulario label {
    display: flex;
    align-items: center;
    gap: 8px; /* Espacio entre checkbox/radio y texto */
    font-size: 1.05em;
    color: #555;
    cursor: pointer;
}

input[type="checkbox"],
input[type="radio"] {
    transform: scale(1.2); /* Agrandar un poco los checkboxes/radios */
    margin-right: 5px;
    accent-color: #1DB954; /* Cambiar el color del checkbox/radio */
}

.simbolos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
    margin-top: 10px;
}

.simbolos label {
    font-size: 28px; /* Tamaño del ícono */
    transition: transform 0.2s ease;
}

.simbolos label:hover {
    transform: translateY(-2px);
}

/* Estilos para el contenedor de la playlist */
.playlist {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Diseño responsivo con grid */
    gap: 30px; /* Espacio entre las tarjetas */
    padding: 0;
    list-style: none;
    margin-top: 30px;
}

.card {
    background-color: #ffffff;
    border-radius: 15px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); /* Sombra más pronunciada para las tarjetas */
    display: flex;
    flex-direction: column; /* Apilar elementos dentro de la tarjeta */
    align-items: center;
    padding: 25px;
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    overflow: hidden;
    border: 2px solid transparent; /* Inicialmente transparente para que se defina con JS */
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.12);
}

/* El círculo del reproductor */
.circle {
    width: 160px; /* Tamaño ligeramente más grande */
    height: 160px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.2); /* Neomorfismo sutil */
    background-color: var(--genre-color, #cccccc); /* Fallback color */
}

.circle .num {
    font-size: 3em; /* Tamaño del ícono/número */
    font-weight: 700;
    color: white; /* Color blanco para el texto dentro del círculo */
    z-index: 2; /* Para que esté por encima de las ondas */
    position: absolute;
    text-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

/* Ondas */
.wave {
    position: absolute;
    width: 200%; /* Más grande para cubrir todo el círculo */
    height: 200%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 255, 255, 0.2); /* Onda blanca translúcida */
    border-radius: 40%; /* Forma de onda más orgánica */
    animation: waveAnimation 5s infinite linear; /* Animación más suave */
    opacity: 0; /* Oculta por defecto */
    transition: opacity 0.5s ease;
    z-index: 1;
}

.wave.animando {
    opacity: 1;
}

.wave:nth-child(2) {
    animation-delay: -2.5s; /* Desfase para la segunda onda */
    opacity: 0;
}

@keyframes waveAnimation {
    0% { transform: translate(-50%, -50%) rotate(0deg) scale(0.8); opacity: 0.8; }
    50% { opacity: 0.4; }
    100% { transform: translate(-50%, -50%) rotate(360deg) scale(1.2); opacity: 0; }
}


.info {
    margin-top: 15px;
    color: #333;
}

.info strong {
    font-size: 1.3em; /* Nombre de la canción más grande */
    color: #2c3e50;
    margin-bottom: 5px;
    display: block;
}

.info small {
    font-size: 0.95em;
    color: #666;
    display: block; /* Cada small en su propia línea */
    margin-bottom: 3px;
}

.controles {
    margin-top: 15px;
    z-index: 3; /* Asegurar que los controles estén encima de las ondas */
}

.controles button {
    background: #3498db; /* Un azul diferente para los controles */
    padding: 8px 15px;
    font-size: 0.9em;
    border-radius: 20px;
    box-shadow: none; /* Eliminar sombra extra */
    margin-bottom: 0; /* No margin-bottom aquí */
}

.controles button:hover {
    background: #2980b9;
    transform: none; /* No levantar el botón de control */
}

small {
    font-size: 0.9em;
    color: #777;
}

/* Media queries para responsividad */
@media (max-width: 768px) {
    .reproductor-container {
        padding: 25px;
    }

    h2 {
        font-size: 1.8em;
    }

    .playlist {
        grid-template-columns: 1fr; /* Una columna en pantallas pequeñas */
    }

    .formulario {
        flex-direction: column; /* Apilar elementos del formulario */
        align-items: stretch;
    }

    input[type="text"],
    select,
    input[type="color"] {
        max-width: 100%; /* Que ocupen todo el ancho disponible */
    }
}
</style>
