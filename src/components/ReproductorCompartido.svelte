<script>
    import { onMount } from 'svelte';
    import CancionesPorDecada from './CancionesPorDecada.svelte';
    import * as d3 from 'd3';

    
    const colorGenero = d3.scaleOrdinal()
        
        .domain(["Pop", "Rock", "Indie", "Electrónica", "Reguetón", "Rap", "Personalizado"])
        .range(["#00CC66", "#CC0000", "#CC0066", "#001BCC", "#CCB400", "#000000", "#FF6600"]); // Color para "Personalizado" se sobreescribe

    const escalaReproducciones = d3.scaleLinear()
        .domain([0, 100])
        .range([50, 150]);

    function obtenerDiametro(reproducciones) {
        const numero = typeof reproducciones === 'string' ? parseFloat(reproducciones.replace(/[^0-9.]/g, "")) : reproducciones;
        return escalaReproducciones(isNaN(numero) ? 0 : numero);
    }


    const simboloSelector = {
        "Var": "/images/Var.png",      
        "Rosita": "/images/Rosita.png", 
        "Steffy": "/images/Steffy.png", 
        "Auricular1": "🎧",
        "Microfono": "🎤",
        "Guitarra": "🎸",
        "Teclado": "🎹"
    };

    const simbolosRandom = ["Auricular1", "Auricular2", "Microfono", "Guitarra", "Teclado", "Var", "Rosita", "Steffy"];

    // ##################################################################
    // # ESTADO DEL COMPONENTE (DATOS DEL USUARIO Y LA PLAYLIST)      #
    // ##################################################################

    let tuNombre = '';
    let generoSeleccionadoColor = 'Pop';
    let simboloSeleccionadoPersonalizado = 'Auricular1';
    let usarSimboloAleatorio = false;
    let colorPersonalizado = '#FF8C00'; // CAMBIO: Color personalizado para el género "Personalizado"

    let busquedaCanciones = '';
    let cancionesDisponibles = [];
    let cancionesFiltradasParaSeleccion = [];

    let miPlaylistPersonalizada = [];

    // Función para determinar si un color es claro (y el texto/símbolo debería ser oscuro)
    function isColorLight(hexColor) {
        if (!hexColor || typeof hexColor !== 'string' || !hexColor.startsWith('#')) return false;

        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);

        // Calcula la luminancia (ITU-R BT.709 standard)
        const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        return luminance > 0.5; // Si la luminancia es > 0.5, se considera claro
    }

    // Nueva función para obtener el color de un género, incluyendo el personalizado
    function getColorForGenre(genre) {
        if (genre === 'Personalizado') {
            return colorPersonalizado;
        }
        // Si el género no está en nuestro dominio (ej. viene del CSV como 'Desconocido'),
        // podemos asignarle un color por defecto o mapearlo a uno existente.
        if (!colorGenero.domain().includes(genre)) {
            return colorGenero('Pop'); // O el color que desees para géneros no reconocidos
        }
        return colorGenero(genre);
    }

    // Esta función determina si el COLOR DEL TEXTO/UI (no el símbolo en sí)
    // debe ser oscuro (negro) o claro (blanco) en el fondo del género.
    function shouldInvertColor(genre) {
        const actualBackgroundColor = getColorForGenre(genre);
        return isColorLight(actualBackgroundColor);
    }

    onMount(async () => {
        const storedPlaylist = localStorage.getItem('miPlaylistMusical');
        if (storedPlaylist) {
            miPlaylistPersonalizada = JSON.parse(storedPlaylist);
        }

        try {
            const data = await d3.csv('high_popularity_spotify_data.csv');

            cancionesDisponibles = data.map((d, index) => {
                let decadaCalculada = 'Desconocida';
                if (d.track_album_release_date) {
                    const year = parseInt(d.track_album_release_date.substring(0, 4));
                    if (!isNaN(year)) {
                        decadaCalculada = `${Math.floor(year / 10) * 10}s`;
                    }
                }

                const parseNum = (val) => (val !== undefined && val !== null && !isNaN(parseFloat(val))) ? parseFloat(val) : 0;
                const parseIntVal = (val) => (val !== undefined && val !== null && !isNaN(parseInt(val))) ? parseInt(val) : 0;

                return {
                    id: d.track_id || d.id || `song-${index}`,
                    nombre: d.track_name || 'Desconocido',
                    artista: d.track_artist || 'Desconocido',
                    generos: d.playlist_genre || 'Pop', // CAMBIO: Si es desconocido, mapeamos a "Pop" por defecto
                    decada: decadaCalculada,
                    danceability: parseNum(d.danceability) * 100,
                    reproducciones: parseIntVal(d.track_popularity),
                    canciones: d.track_href,
                    youtube: d.track_href,
                    billboard: 0,
                    energy: parseNum(d.energy),
                    tempo: parseNum(d.tempo),
                    loudness: parseNum(d.loudness),
                    liveness: parseNum(d.liveness),
                    valence: parseNum(d.valence),
                    time_signature: parseIntVal(d.time_signature),
                    speechiness: parseNum(d.speechiness),
                    uri: d.uri,
                    track_album_name: d.track_album_name,
                    playlist_name: d.playlist_name,
                    analysis_url: d.analysis_url,
                    track_album_release_date: d.track_album_release_date,
                    instrumentalness: parseNum(d.instrumentalness),
                    track_album_id: d.track_album_id,
                    mode: parseIntVal(d.mode),
                    key: parseIntVal(d.key),
                    duration_ms: parseIntVal(d.duration_ms),
                    acousticness: parseNum(d.acousticness),
                    original_csv_id: d.id,
                    playlist_subgenre: d.playlist_subgenre,
                    type: d.type,
                    playlist_id: d.playlist_id
                };
            }).filter(d => d.nombre && d.artista && d.reproducciones !== undefined && d.reproducciones !== null);

            console.log("Datos del CSV cargados y mapeados:", cancionesDisponibles.slice(0, 5));

        } catch (error) {
            console.error("Error al cargar el CSV:", error);
            alert("Hubo un error al cargar las canciones. Por favor, verifica el archivo CSV y su ubicación.");
        }
    });

    $: {
        if (miPlaylistPersonalizada.length > 0) {
            localStorage.setItem('miPlaylistMusical', JSON.stringify(miPlaylistPersonalizada));
        } else {
            localStorage.removeItem('miPlaylistMusical');
        }
    }

    $: if (busquedaCanciones.length > 2) {
        cancionesFiltradasParaSeleccion = cancionesDisponibles.filter(cancion =>
            cancion.nombre.toLowerCase().includes(busquedaCanciones.toLowerCase()) ||
            cancion.artista.toLowerCase().includes(busquedaCanciones.toLowerCase())
        );
    } else {
        cancionesFiltradasParaSeleccion = [];
    }

    function getRandomSimbolo() {
        const randomIndex = Math.floor(Math.random() * simbolosRandom.length);
        return simbolosRandom[randomIndex];
    }

    function agregarCancionPersonalizada(cancionBase) {
        if (!tuNombre.trim()) {
            alert('Por favor, ingresa tu nombre antes de personalizar una canción.');
            return;
        }

        const simboloKeyAsignado = usarSimboloAleatorio ? getRandomSimbolo() : simboloSeleccionadoPersonalizado;
        const simboloFinal = simboloSelector[simboloKeyAsignado] || "❓";

        const cancionPersonalizada = {
            ...cancionBase,
            generos: generoSeleccionadoColor,
            eligio: simboloFinal,
            creador: tuNombre,
        };

        if (!miPlaylistPersonalizada.some(c => c.id === cancionPersonalizada.id && c.creador === cancionPersonalizada.creador)) {
            miPlaylistPersonalizada = [...miPlaylistPersonalizada, cancionPersonalizada];
        } else {
            alert(`La canción "${cancionBase.nombre}" (personalizada por ti) ya está en tu playlist.`);
        }
    }

    function eliminarDeMiPlaylist(cancionId, creadorNombre) {
        miPlaylistPersonalizada = miPlaylistPersonalizada.filter(cancion =>
            !(cancion.id === cancionId && cancion.creador === creadorNombre)
        );
    }
    
</script>

<div class="reproductor-container">
    <h2>Crea Tu Propio Reproductor Musical</h2>
    <p>Busca tus canciones favoritas, personalízalas con tu estilo y añádelas a tu lista.</p>

    <div class="personalizacion-form">
        <h3>Tu Estilo Personal</h3>
        <div class="form-group">
            <label for="tuNombre">Tu Nombre:</label>
            <input type="text" id="tuNombre" bind:value={tuNombre}  />
        </div>
        <div class="form-group">
            <label for="generoColor">Color de tu Gusto (por Género):</label>
            <select id="generoColor" bind:value={generoSeleccionadoColor}>
                {#each colorGenero.domain() as genero}
                    <option value={genero}>{genero}</option>
                {/each}
            </select>
            <div class="color-preview" style="background-color: {getColorForGenre(generoSeleccionadoColor)};"></div>
            {#if generoSeleccionadoColor === 'Personalizado'}
                <label for="customColor" class="mt-2">Color Personalizado:</label>
                <input type="color" id="customColor" bind:value={colorPersonalizado} />
            {/if}
        </div>
        <div class="form-group">
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label>Símbolo Personalizado:</label>
            <div class="simbolo-selector-opciones">
                {#each Object.keys(simboloSelector) as simboloKey}
                    <label class="simbolo-radio">
                        <input type="radio" name="simbolo" value={simboloKey} bind:group={simboloSeleccionadoPersonalizado} disabled={usarSimboloAleatorio} />
                        {#if simboloSelector[simboloKey].startsWith('/')}
                            <span
                                class="simbolo-preview-span is-image"
                                style="
                                    mask-image: url({simboloSelector[simboloKey]});
                                    background-color: {getColorForGenre(generoSeleccionadoColor)};
                                "
                                role="img"
                                aria-label="{simboloKey}"
                            ></span>
                        {:else}
                            <span
                                class="simbolo-preview-span is-emoji"
                                style="
                                    color: {getColorForGenre(generoSeleccionadoColor)};
                                "
                                role="img"
                                aria-label="{simboloKey}"
                            >
                                {simboloSelector[simboloKey]}
                            </span>
                        {/if}
                    </label>
                {/each}
            </div>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" id="usarRandom" bind:checked={usarSimboloAleatorio} />
            <label for="usarRandom">Elegir un Símbolo Aleatorio (para gustos mixtos)</label>
        </div>
    </div>

    <hr>

    <div class="buscador-musica">
        <h3>Añade Canciones a Tu Playlist</h3>
        <input
            type="text"
            bind:value={busquedaCanciones}
            placeholder="Busca canciones por nombre o artista (mín. 3 letras)..."
            class="input-busqueda"
        />

        {#if busquedaCanciones.length > 2 && cancionesFiltradasParaSeleccion.length === 0}
            <p class="mensaje-no-encontrado">¡Ups! Esa canción no está en nuestra colección. Intenta otra.</p>
        {:else if cancionesFiltradasParaSeleccion.length > 0}
            <div class="resultados-busqueda">
                {#each cancionesFiltradasParaSeleccion as cancion (cancion.id)}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div class="resultado-item" on:click={() => agregarCancionPersonalizada(cancion)}>
                        <span>{cancion.nombre} - {cancion.artista} ({cancion.decada})</span>
                        <button class="boton-agregar">➕ Personalizar</button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <hr>

    <h3 class="mi-playlist-titulo">Tu Playlist Personalizada ({miPlaylistPersonalizada.length} canciones)</h3>

    {#if miPlaylistPersonalizada.length > 0}
        <div class="mi-playlist-visualizacion">
            <CancionesPorDecada
                canciones={miPlaylistPersonalizada}
                {obtenerDiametro}
                {simboloSelector}
                {shouldInvertColor}
                {getColorForGenre}
            />
        </div>
    {:else}
        <p class="mensaje-vacio">Aún no has personalizado ninguna canción. <br>¡Empieza a buscar y añadir las tuyas!</p>
    {/if}
</div>

<style>
    .reproductor-container {
        font-family: 'Raleway', sans-serif;
        background-color: #f8f8f8;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        max-width: 900px;
        margin: 50px auto;
        text-align: center;
        color: #333;
    }

    h2 {
        color: #003058;
        font-size: 2.5em;
        margin-bottom: 15px;
        font-weight: 700;
    }

    .mi-playlist-titulo {
        color: #15FB88;
        font-size: 1.8em;
        margin-top: 40px;
        margin-bottom: 25px;
        font-weight: 600;
    }

    p {
        font-size: 1.1em;
        line-height: 1.6;
        margin-bottom: 20px;
    }

    .personalizacion-form, .buscador-musica {
        padding: 0x;
    
        text-align: left;
        margin-bottom: 40px;
    }

    .personalizacion-form h3, .buscador-musica h3 {
        color: #003058;
        font-size: 1.6em;
        margin-bottom: 25px;
        text-align: center;
    }

    .form-group {
        margin-bottom: 20px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .form-group label {
        font-weight: 600;
        color: #555;
        margin-bottom: 8px;
        font-size: 1em;
    }
    .form-group label.mt-2 {
        margin-top: 15px;
    }


    .form-group input[type="text"],
    .form-group select {
        width: calc(100% - 20px);
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1em;
        transition: border-color 0.3s ease;
    }

    .form-group input[type="text"]:focus,
    .form-group select:focus {
        border-color: #15FB88;
        outline: none;
    }

    .form-group input[type="color"] {
        width: 100px;
        height: 40px;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 0;
        cursor: pointer;
    }

    .form-group .color-preview {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 1px solid #ccc;
        margin-top: 10px;
    }

    .simbolo-selector-opciones {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        margin-top: 10px;
    }

    .simbolo-radio {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 8px;
        border: 1px solid #eee;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .simbolo-radio:hover {
        background-color: #f0f0f0;
    }

    .simbolo-radio input[type="radio"] {
        margin-bottom: 5px;
        transform: scale(1.2);
    }

    .simbolo-preview-span {
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid transparent;
        border-radius: 4px;
        transition: all 0.2s ease;
    }
    
    .simbolo-preview-span.is-emoji {
        font-size: 24px;
        line-height: 1;
    }

    .simbolo-preview-span.is-image {
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        background-color: black; /* Default color for the mask, will be overridden by inline style */
    }

    .simbolo-radio input[type="radio"]:checked + .simbolo-preview-span {
        border-color: #15FB88;
        box-shadow: 0 0 5px rgba(21, 251, 136, 0.5);
    }

    .checkbox-group {
        flex-direction: row;
        align-items: center;
    }

    .checkbox-group input[type="checkbox"] {
        margin-right: 10px;
        transform: scale(1.2);
    }

    .input-busqueda {
        width: calc(100% - 40px);
        padding: 15px 20px;
        border: 2px solid #ccc;
        border-radius: 30px;
        font-size: 1.1em;
        outline: none;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
        margin-bottom: 20px;
    }

    .input-busqueda:focus {
        border-color: #15FB88;
        box-shadow: 0 0 10px rgba(21, 251, 136, 0.3);
    }

    .resultados-busqueda {
        background-color: white;
        border: 1px solid #eee;
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 10;
        margin-top: 10px;
        text-align: left;
    }

    .resultado-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }

    .resultado-item:hover {
        background-color: #f5f5f5;
    }

    .resultado-item:last-child {
        border-bottom: none;
    }

    .resultado-item span {
        flex-grow: 1;
        margin-right: 15px;
        color: #555;
        font-size: 1em;
    }

    .boton-agregar {
        background-color: #003058;
        color: white;
        border: none;
        border-radius: 50px;
        padding: 8px 15px;
        font-size: 0.9em;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.2s ease, transform 0.2s ease;
    }

    .boton-agregar:hover {
        background-color: #15FB88;
        color: #000;
        transform: scale(1.05);
    }

    .mensaje-no-encontrado, .mensaje-vacio {
        color: #777;
        font-style: italic;
        margin-top: 20px;
        justify-content:center;
        text-align: center;
    }

    .mi-playlist-visualizacion {
        margin-top: 20px;
        padding: 10px;
    }

    hr {
        border: none;
        border-top: 1px solid #eee;
        margin: 40px 0;
    }
</style>