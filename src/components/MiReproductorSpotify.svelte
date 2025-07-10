<script>
    import { onMount } from "svelte";
    import { get } from 'svelte/store'; // Para leer el store sin subscribirse reactivamente
    import * as d3 from 'd3';
    import { playerConfig } from './ReproductorPersonalizador.svelte';

    // Propiedades que se recibirán del store o como props
    export let miPlaylistPersonalizada = [];
    export let tuNombre = "Anónimo";
    export let generoSeleccionadoColor = "Pop";
    export let colorPersonalizado = "#FF9F1C";
    export let simboloSeleccionado = "🎵";

    // Reutilizamos la escala de colores y símbolos del personalizador para consistencia
    const colorGeneroScale = d3.scaleOrdinal()
        .domain(["Pop", "Rock", "Indie", "Electrónica", "Reguetón", "Rap", "Personalizado"])
        .range(["#FF6B6B", "#4ECDC4", "#45B7D1", "#F7FFF7", "#A77DC2", "#333333", "#FF9F1C"]); 

    const simboloSelectorMap = {
        "🎧": "Auricular",
        "🎤": "Microfono",
        "🎸": "Guitarra",
        "🎹": "Teclado",
        "🎵": "Nota Musical"
    };

    let audio = new Audio();
    let currentlyPlaying = null;
    let activeSongInfo = null; // Almacenará la canción para mostrar el pop-up

    // Función para obtener el color del género (incluyendo el personalizado)
    function getColorForGenre(genre) {
        return genre === 'Personalizado' ? colorPersonalizado : colorGeneroScale(genre);
    }

    // Funciones para la visualización de la onda (sin cambios, asumiendo que danceability vendría de Spotify)
    function wavePath(songPopularity) {
        // Usamos la popularidad para la amplitud de la onda
        const amplitudeFactor = d3.scaleLinear().domain([0, 100]).range([1, 8]); // Ajusta el rango si la popularidad es diferente
        const frequencyFactor = d3.scaleLinear().domain([0, 100]).range([0.05, 0.3]);

        const amplitude = amplitudeFactor(songPopularity || 50); // Valor por defecto si no hay popularidad
        const frequency = frequencyFactor(songPopularity || 50);

        const width = 100;
        const baseY = width * 0.16;

        let d = `M 0 ${baseY}`;
        for (let x = 0; x < width; x += 1) {
            const waveY = Math.sin(x * frequency) * amplitude;
            const y = baseY + waveY;
            d += ` L ${x} ${y}`;
        }
        return d;
    }

    function strokeWidth(diameter) {
        const minStroke = 0.8;
        const maxStroke = 3.5;
        const maxDiameter = 150;
        const clampedDiameter = Math.min(diameter, maxDiameter);
        return minStroke + (maxStroke - minStroke) * (clampedDiameter / maxDiameter);
    }

    // Calcular diámetro del círculo basado en la popularidad (reproducciones)
    const obtenerDiametro = d3.scaleLinear()
        .domain([0, 100]) // Rango de popularidad de Spotify
        .range([60, 180]) // Rango de diámetro en pixeles (ajusta según necesites)
        .clamp(true); // Asegura que el valor esté dentro del rango

    // Función para manejar el clic en la canción
    function handleClickCancion(cancion) {
        const audioUrl = cancion.preview_url;

        if (!audioUrl) {
            alert("Esta canción no tiene una previsualización disponible en Spotify.");
            return;
        }

        if (currentlyPlaying === audioUrl) {
            audio.pause();
            audio.currentTime = 0;
            currentlyPlaying = null;
            activeSongInfo = null;
            return;
        }

        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        currentlyPlaying = audioUrl;
        audio.load();

        audio
            .play()
            .then(() => {
                activeSongInfo = cancion;
            })
            .catch(error => {
                console.error("Error playing audio:", error);
                alert("No se pudo reproducir la previsualización. Intenta de nuevo.");
                currentlyPlaying = null;
                activeSongInfo = null;
            });

        audio.onended = () => {
            currentlyPlaying = null;
            activeSongInfo = null;
        };
    }

    // Cerrar el pop-up si se hace clic fuera
    function closePopupOnClickOutside(event) {
        const popup = document.querySelector('.cancion-info-popup');
        const songCircles = document.querySelectorAll('.cancion');
        let clickedInsidePopup = popup && popup.contains(event.target);
        let clickedOnSongCircle = Array.from(songCircles).some(circle => circle.contains(event.target));

        if (activeSongInfo && !clickedInsidePopup && !clickedOnSongCircle) {
            activeSongInfo = null;
            if (currentlyPlaying) {
                audio.pause();
                audio.currentTime = 0;
                currentlyPlaying = null;
            }
        }
    }

    onMount(() => {
        document.body.addEventListener('click', closePopupOnClickOutside);
        return () => {
            document.body.removeEventListener('click', closePopupOnClickOutside);
            if (currentlyPlaying) {
                audio.pause();
                audio.currentTime = 0;
                currentlyPlaying = null;
            }
        };
    });

    // Suscribirse al store de playerConfig para actualizar las props reactivamente
    $: {
        const config = get(playerConfig);
        miPlaylistPersonalizada = config.miPlaylistPersonalizada;
        tuNombre = config.tuNombre;
        generoSeleccionadoColor = config.generoSeleccionadoColor;
        colorPersonalizado = config.colorPersonalizado;
        simboloSeleccionado = config.simboloSeleccionado;
    }
</script>

<div class="player-display-area">
    {#if miPlaylistPersonalizada.length > 0}
        <h2 class="player-title">Reproductor Personalizado de {tuNombre}</h2>
        <div class="player-metadata">
            <span class="player-symbol">{simboloSeleccionado}</span>
            <span class="player-genre" style="background-color: {getColorForGenre(generoSeleccionadoColor)};">
                {generoSeleccionadoColor === 'Personalizado' ? 'Tu color' : generoSeleccionadoColor}
            </span>
            <span class="player-symbol">{simboloSeleccionado}</span>
        </div>

        <div class="songs-grid">
            {#each miPlaylistPersonalizada as cancion (cancion.id)}
                {@const diametro = obtenerDiametro(cancion.popularity)}
                <div class="song-item-wrapper">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="song-circle"
                        on:click={() => handleClickCancion(cancion)}
                        style="
                            width: {diametro}px;
                            height: {diametro}px;
                            background-color: {getColorForGenre(cancion.generos || generoSeleccionadoColor)};
                            border: 3px solid {currentlyPlaying === cancion.preview_url ? 'gold' : 'transparent'};
                            box-shadow: {currentlyPlaying === cancion.preview_url ? '0 0 15px gold' : 'none'};
                        "
                    >
                        <div
                            class="inner-circle"
                            style="width: {diametro * 0.5}px; height: {diametro * 0.5}px;"
                        >
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 100 30"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d={wavePath(cancion.popularity)}
                                    fill="none"
                                    stroke={getColorForGenre(cancion.generos || generoSeleccionadoColor)}
                                    stroke-width={strokeWidth(diametro)}
                                    stroke-linecap="round"
                                    vector-effect="non-scaling-stroke"
                                />
                            </svg>
                        </div>
                        <span class="play-pause-icon">
                            {currentlyPlaying === cancion.preview_url ? '❚❚' : '▶'}
                        </span>
                        {#if cancion.popularity > 70}
                            <span class="hot-track-badge">🔥</span>
                        {/if}
                    </div>
                    <div class="song-title">{cancion.canciones}</div>
                    <a href={cancion.external_url} target="_blank" rel="noopener noreferrer" class="artist-name">
                        {cancion.artistas}
                    </a>
                </div>
            {/each}
        </div>
    {:else}
        <p class="no-songs-message">Conéctate a Spotify en la sección superior para ver tus canciones principales aquí.</p>
    {/if}
</div>

{#if activeSongInfo}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="song-info-overlay" on:click|self={closePopupOnClickOutside}>
        <div class="song-info-popup">
            <button class="close-popup" on:click={() => { activeSongInfo = null; if (currentlyPlaying) { audio.pause(); audio.currentTime = 0; currentlyPlaying = null; } }}>×</button>
            <h3>{activeSongInfo.canciones}</h3>
            <h4>{activeSongInfo.artistas}</h4>
            <p><strong>Popularidad en Spotify:</strong> {activeSongInfo.popularity}%</p>
            <p><strong>Elegida por:</strong> {activeSongInfo.creador || tuNombre}.</p>
            {#if activeSongInfo.preview_url}
                <button class="vote-button" on:click={() => window.open(activeSongInfo.external_url, "_blank")}>Abrir en Spotify</button>
            {:else}
                <p class="no-preview">No hay previsualización disponible para esta canción.</p>
                <button class="vote-button" on:click={() => window.open(activeSongInfo.external_url, "_blank")}>Abrir en Spotify</button>
            {/if}
        </div>
    </div>
{/if}

<style>
    .player-display-area {
        max-width: 900px;
        margin: 50px auto;
        padding: 30px;
        background: linear-gradient(145deg, #e6e9ed, #f6f8fa);
        border-radius: 25px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
        text-align: center;
        font-family: 'Inter', sans-serif;
        color: #333;
        border: 1px solid #d8dee4;
    }

    .player-title {
        color: #1a237e;
        font-size: 2.8em;
        margin-bottom: 15px;
        font-weight: 800;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
    }

    .player-metadata {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        margin-bottom: 40px;
        font-size: 1.4em;
        color: #6a1b9a;
        font-weight: 600;
    }

    .player-symbol {
        font-size: 1.8em;
        animation: pulse 1.5s infinite alternate;
    }

    .player-genre {
        padding: 8px 15px;
        border-radius: 20px;
        color: white;
        font-size: 0.8em;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .songs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 35px;
        justify-content: center;
        align-items: flex-start;
    }

    .song-item-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: transform 0.3s ease;
    }

    .song-item-wrapper:hover {
        transform: translateY(-8px);
    }

    .song-circle {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease-in-out;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        flex-shrink: 0; /* Evita que el círculo se encoja */
    }

    .song-circle:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);
    }

    .inner-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.95);
        z-index: 2;
        overflow: hidden;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
    }

    .inner-circle svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 3;
    }

    .play-pause-icon {
        position: absolute;
        z-index: 4;
        font-size: 2.5em; /* Icono más grande */
        color: rgba(0, 0, 0, 0.7);
        text-shadow: 1px 1px 3px rgba(255,255,255,0.8);
    }

    .hot-track-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: #ff4d4f; /* Rojo vibrante */
        color: white;
        border-radius: 50%;
        padding: 5px 8px;
        font-size: 0.8em;
        font-weight: bold;
        animation: bounce 0.8s infinite alternate;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    @keyframes bounce {
        from { transform: translateY(0); }
        to { transform: translateY(-5px); }
    }

    .song-title {
        margin-top: 15px;
        font-size: 1.2em;
        font-weight: 700;
        color: #1a237e;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
    }

    .artist-name {
        font-size: 0.9em;
        color: #6a1b9a;
        margin-top: 5px;
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .artist-name:hover {
        text-decoration: underline;
        color: #4a148c;
    }

    .no-songs-message {
        font-size: 1.3em;
        color: #777;
        margin-top: 50px;
        font-style: italic;
    }

    /* Pop-up de información */
    .song-info-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(5px); /* Efecto de desenfoque */
        animation: fadeIn 0.3s ease-out;
    }

    .song-info-popup {
        background: linear-gradient(145deg, #ffffff, #f0f0f0);
        padding: 35px;
        border-radius: 20px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 500px;
        width: 90%;
        position: relative;
        color: #333;
        font-family: 'Inter', sans-serif;
        animation: slideIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        border: 1px solid #e0e0e0;
    }

    .song-info-popup h3 {
        color: #1a237e;
        font-size: 2.2em;
        margin-bottom: 10px;
        font-weight: 700;
    }

    .song-info-popup h4 {
        color: #6a1b9a;
        font-size: 1.5em;
        margin-bottom: 20px;
        font-weight: 500;
    }

    .song-info-popup p {
        font-size: 1.1em;
        margin-bottom: 15px;
        line-height: 1.6;
    }

    .close-popup {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 2em;
        cursor: pointer;
        color: #999;
        transition: color 0.2s ease, transform 0.2s ease;
    }

    .close-popup:hover {
        color: #555;
        transform: rotate(90deg);
    }

    .song-info-popup .vote-button {
        background-color: #1DB954; /* Verde Spotify */
        color: white;
        padding: 12px 25px;
        border: none;
        border-radius: 30px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1em;
        transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        margin-top: 20px;
        box-shadow: 0 4px 15px rgba(29, 185, 84, 0.4);
    }

    .song-info-popup .vote-button:hover {
        background-color: #1AA84D;
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(29, 185, 84, 0.6);
    }

    .no-preview {
        color: #e74c3c;
        font-style: italic;
        margin-top: 10px;
    }

    /* Animaciones */
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.05); opacity: 0.9; }
    }
</style>