<script>
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import * as d3 from 'd3';

    // Importamos el store de afinidad de tu App.svelte
    // Asegúrate de que esta ruta sea correcta para tu proyecto
    import { reproduccionesPorPersona } from "../stores.js"; // O la ruta correcta a tu stores.js

    // --- Datos para el autocompletado y colores ---
    let allSongsData = [];

    // Definición de colores de género (copiado de tu App.svelte)
    const colorGenero = d3.scaleOrdinal()
        .domain(["Pop", "Rock", "Indie", "Electrónica", "Reggaetón", "Rap", "Balada", "Regional", "Trap", "Funk", "Cumbia Pop", "Rock Latino", "Metal"])
        .range(["#00CC66", "#CC0000", "#CC0066", "#001BCC", "#CCB400", "#000000", "#800080", "#FFA500", "#DAA520", "#FF1493", "#32CD32", "#6A5ACD", "#8B0000"]);

    // Símbolos para el selector - ¡Nombres actualizados para coincidir con tus imágenes!
    const simboloSelector = {
        Var: "/images/Var.png",
        Rosita: "/images/Rosita.png",
        Steffy: "/images/Steffy.png",
        Cruz: "/images/Cruz.png",
        Igual: "/images/Igual.png"
    };

    // --- Stores para los reproductores creados ---
    export const userReproducers = writable(JSON.parse(localStorage.getItem('userReproducers') || '[]'));

    userReproducers.subscribe(value => {
        localStorage.setItem('userReproducers', JSON.stringify(value));
    });

    // --- Variables del formulario ---
    let userName = "";
    let songName = "";
    let artistName = "";
    let selectedGenre = "";
    let selectedColor = "#00CC66";
    let danzabilityInput = 0;
    let moodInput = "";

    // --- Variables para la asignación de símbolo ---
    let assignedSymbol = "";
    let assignedSymbolText = "";
    let assignedSymbolDescription = ""; // Nueva variable para la descripción
    let isCalculatingSymbol = true;

    // Sugerencias para autocompletado
    let songSuggestions = [];
    let artistSuggestions = [];
    let genreSuggestions = [];

    // --- Lógica de carga de datos al iniciar el componente ---
    onMount(async () => {
        try {
            allSongsData = await d3.csv("/cancionescompartidas.csv");
            console.log("Canciones compartidas cargadas:", allSongsData);

            const uniqueGenresFromCsv = [...new Set(allSongsData.map(d => d.Genero).filter(Boolean))];
            colorGenero.domain(Array.from(new Set([...colorGenero.domain(), ...uniqueGenresFromCsv])));

            await new Promise(resolve => setTimeout(resolve, 500));
            assignSymbolBasedOnAfinity();
            isCalculatingSymbol = false;

        } catch (error) {
            console.error("Error al cargar cancionescompartidas.csv:", error);
            isCalculatingSymbol = false;
        }
    });

    // --- Funciones de autocompletado ---
    function filterSuggestions(query, type) {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();

        if (type === 'song') {
            return allSongsData
                .filter(d => d.Cancion && d.Cancion.toLowerCase().includes(lowerQuery))
                .map(d => d.Cancion)
                .slice(0, 5);
        } else if (type === 'artist') {
            return [...new Set(allSongsData.filter(d => d.Artista && d.Artista.toLowerCase().includes(lowerQuery))
                .map(d => d.Artista))]
                .slice(0, 5);
        } else if (type === 'genre') {
            return [...new Set(allSongsData.map(d => d.Genero))]
                .filter(g => g && g.toLowerCase().includes(lowerQuery))
                .slice(0, 5);
        }
        return [];
    }

    function handleSongInput(event) {
        songName = event.target.value;
        songSuggestions = filterSuggestions(songName, 'song');
        artistName = "";
        selectedGenre = "";
        danzabilityInput = 0;
        moodInput = "";
    }

    function selectSong(suggestion) {
        songName = suggestion;
        const foundSong = allSongsData.find(d => d.Cancion === suggestion);
        if (foundSong) {
            artistName = foundSong.Artista;
            selectedGenre = foundSong.Genero;
            selectedColor = colorGenero(selectedGenre);
            danzabilityInput = +foundSong.Danzabilidad;
            moodInput = foundSong.Mood;
        }
        songSuggestions = [];
    }

    function handleArtistInput(event) {
        artistName = event.target.value;
        artistSuggestions = filterSuggestions(artistName, 'artist');
    }

    function selectArtist(suggestion) {
        artistName = suggestion;
        artistSuggestions = [];
    }

    function handleGenreInput(event) {
        selectedGenre = event.target.value;
        selectedColor = colorGenero(selectedGenre);
        genreSuggestions = filterSuggestions(selectedGenre, 'genre');
    }

    function selectGenre(suggestion) {
        selectedGenre = suggestion;
        selectedColor = colorGenero(selectedGenre);
        genreSuggestions = [];
    }

    // --- Lógica de asignación de símbolo basada en afinidad ---
    function assignSymbolBasedOnAfinity() {
        const currentReproducciones = get(reproduccionesPorPersona);
        const total = currentReproducciones.Steffy + currentReproducciones.Rosita + currentReproducciones.Var;

        if (total > 0) {
            const afinidades = [
                { nombre: "Steffy", porcentaje: (currentReproducciones.Steffy / total) * 100, simbolo: simboloSelector.Steffy },
                { nombre: "Rosita", porcentaje: (currentReproducciones.Rosita / total) * 100, simbolo: simboloSelector.Rosita },
                { nombre: "Var", porcentaje: (currentReproducciones.Var / total) * 100, simbolo: simboloSelector.Var }
            ];
            afinidades.sort((a, b) => b.porcentaje - a.porcentaje);

            const top1 = afinidades[0];
            const top2 = afinidades[1];

            if (top1.porcentaje === top2.porcentaje) {
                assignedSymbol = simboloSelector.Igual;
                assignedSymbolText = "Igual";
                assignedSymbolDescription = `Tu porcentaje de afinidad con ${top1.nombre} y ${top2.nombre} fue del ${top1.porcentaje.toFixed(2)}% cada uno. ¡Hay un empate!`;
            } else {
                assignedSymbol = top1.simbolo;
                assignedSymbolText = top1.nombre;
                assignedSymbolDescription = `Tu afinidad principal es con ${top1.nombre} (${top1.porcentaje.toFixed(2)}%).`;
            }
        } else {
            assignedSymbol = simboloSelector.Cruz;
            assignedSymbolText = "Cruz";
            assignedSymbolDescription = "Aún no has jugado o no hay reproducciones registradas. ¡Juega para descubrir tu afinidad!";
        }
        console.log("Símbolo asignado:", assignedSymbolText, assignedSymbol);
    }

    // Reactividad: la función se ejecuta cada vez que 'reproduccionesPorPersona' cambia
    $: {
        assignSymbolBasedOnAfinity();
    }


    // --- Función para crear un nuevo reproductor ---
    function createReproducer() {
        if (!userName || !songName || !artistName || !selectedGenre || danzabilityInput === null || moodInput === "") {
            alert("Por favor, completa todos los campos: Nombre/Apodo, Canción, Artista, Género, Danzabilidad y Mood.");
            return;
        }

        const finalDanzability = Math.max(0, Math.min(100, parseInt(danzabilityInput) || 0));

        const newReproducer = {
            id: Date.now(),
            userName,
            songName,
            artistName,
            genre: selectedGenre,
            color: selectedColor,
            danzability: finalDanzability,
            mood: moodInput,
            symbol: assignedSymbol,
            symbolText: assignedSymbolText
        };

        userReproducers.update(currentReproducers => [...currentReproducers, newReproducer]);

        // Limpiar formulario y "vaciar" el símbolo asignado
        userName = "";
        songName = "";
        artistName = "";
        selectedGenre = "";
        selectedColor = colorGenero("Pop");
        danzabilityInput = 0;
        moodInput = "";
        assignedSymbol = ""; // Vaciar la imagen del símbolo
        assignedSymbolText = ""; // Vaciar el texto del símbolo
        assignedSymbolDescription = ""; // Vaciar la descripción
        isCalculatingSymbol = true; // Preparar para el próximo cálculo
    }

    // --- Función para borrar todos los reproductores guardados ---
    function clearReproducers() {
        if (confirm("¿Estás seguro de que quieres borrar TODOS los reproductores creados? Esta acción es irreversible.")) {
            userReproducers.set([]);
            console.log("Reproductores borrados de localStorage.");
        }
    }

    // --- Lógica para el círculo del reproductor (igual que en App.svelte) ---
    function obtenerDiametroReproductorUsuario() {
        return 120; // Diámetro fijo para los reproductores creados por el usuario
    }

    function wavePathReproductorUsuario(danzability) {
        const danceability = parseFloat(danzability || 50);
        const maxAmplitude = 6;
        const baseAmplitude = 1;
        const amplitude =
            baseAmplitude + (maxAmplitude - baseAmplitude) * (danceability / 100);

        const minFrequency = 0.0;
        const maxFrequency = 0.65;
        const frequency =
            minFrequency + (maxFrequency - minFrequency) * (danceability / 100);

        const width = 100;
        const baseY = width * 0.16;

        let d = `M 0 ${baseY}`;
        for (let x = 0; x < width; x += 1) {
            const waveY = Math.sin(x * frequency)
            const y = baseY + waveY * amplitude
            d += ` L ${x} ${y}`
        }
        return d
    }

    function strokeWidthReproductorUsuario() {
        return 2;
    }

    // Simple función para obtener un emoji de mood, si se desea una visualización extra
    function getMoodEmoji(mood) {
        switch (mood.toLowerCase()) {
            case 'flow': return '🌊';
            case 'perreo': return '🔥';
            case 'trap': return '🚧';
            case 'fiesta': return '🎉';
            case 'club': return '🎶';
            case 'sexy': return '💋';
            case 'electrónico': return '⚡';
            case 'melancólico': return '😔';
            case 'divertido': return '😂';
            case 'bailable': return '💃';
            case 'alternativo': return '🤘';
            case 'retro': return '✨';
            case 'funky': return '🕺';
            case 'alegre': return '😊';
            case 'relajado': return '😌';
            case 'chill': return '🛋️';
            case 'romántico': return '❤️';
            case 'intenso': return '💥';
            case 'calle': return '🛣️';
            case 'empowerment': return '💪';
            case 'melódico': return '🎤';
            case 'oscuro': return '🖤';
            case 'épico': return ' epic';
            case 'legendario': return '👑';
            case 'veraniego': return '☀️';
            case 'glam': return '💎';
            case 'reflexivo': return '🤔';
            case 'powerful': return '⚡';
            case 'seductor': return '😏';
            case 'cool': return '😎';
            case 'sarcástico': return ' sarcastic';
            case 'historia': return '📜';
            case 'disco': return '🪩';
            case 'metal': return '🤘';
            default: return '🎧';
        }
    }
</script>

<style>
    /* Estilos generales para el componente */
    .reproductor-compartido-container {
        max-width: 900px;
        margin: 40px auto;
        padding: 30px;
        background-color: #f9f9f9;
        border-radius: 15px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        font-family: 'Raleway', sans-serif;
        color: #333;
        text-align: center;
    }

    .reproductor-compartido-container h2 {
        color: #003058;
        margin-bottom: 25px;
        font-size: 2.2em;
    }

    .form-crear-reproductor {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 40px;
        text-align: left;
    }

    .form-group {
        position: relative;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        color: #555;
    }

    .form-group input {
        width: calc(100% - 20px); /* Ajuste para padding */
        padding: 12px 10px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 1em;
        box-sizing: border-box; /* Incluye padding y borde en el ancho */
        transition: border-color 0.3s ease;
    }


    .form-group input:focus {
        border-color: #003058;
        outline: none;
    }

    .suggestions-list {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: white;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 8px 8px;
        z-index: 10; /* Asegura que las sugerencias estén por encima de otros elementos */
        max-height: 150px;
        overflow-y: auto;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    }

    .suggestion-item {
        padding: 10px;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.2s ease;
    }

    .suggestion-item:hover {
        background-color: #eee;
    }

    .color-input-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 15px; /* Más espacio para separar del input de Género */
        padding-top: 10px; /* Padding para que el separador sea visible */
        border-top: 1px dashed #eee; /* Separador sutil */
    }

    .color-input-wrapper label {
        margin-bottom: 0; /* Ajuste para la etiqueta dentro del flexbox */
    }

    .color-input-wrapper input[type="color"] {
        width: 50px;
        height: 40px;
        padding: 0;
        border: none;
        cursor: pointer;
        border-radius: 5px;
        overflow: hidden; /* Oculta los bordes por defecto del color picker */
        margin-left: 10px; /* Empuja el color picker a la derecha */
    }
    /* Estilos específicos para el color picker en navegadores WebKit (Chrome, Edge, Safari) */
    .color-input-wrapper input[type="color"]::-webkit-color-swatch-wrapper {
        padding: 0;
    }
    .color-input-wrapper input[type="color"]::-webkit-color-swatch {
        border: none;
    }

    .current-symbol {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2em;
        margin-top: 10px;
        color: #003058;
    }

    .current-symbol span.bold-symbol-text {
        font-weight: bold; /* Hace el texto en negrita */
        margin-right: 5px; /* Pequeño espacio entre el texto y la imagen */
    }


    .current-symbol img {
        width: 30px;
        height: 30px;
        margin-left: 10px;
        vertical-align: middle;
        object-fit: contain; /* Para que el símbolo se vea bien */
        /* SÍMBOLO ASIGNADO EN EL FORMULARIO SIEMPRE EN NEGRO */
        filter: brightness(0);
    }

    .description-symbol {
        font-size: 0.85em;
        color: #777;
        margin-top: 5px;
        line-height: 1.4;
    }

    .btn-crear-reproductor {
        grid-column: 1 / -1; /* Ocupa ambas columnas */
        background-color: #15FB88;
        color: #000;
        padding: 14px 30px;
        border: none;
        border-radius: 25px;
        font-weight: bold;
        cursor: pointer;
        font-size: 1.1em;
        transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        margin-top: 20px;
        box-shadow: 0 4px 8px rgba(21, 251, 136, 0.4);
    }

    .btn-crear-reproductor:hover {
        background-color: #00CC66;
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 204, 102, 0.5);
    }

    /* Estilos para el botón de borrar reproductores */
    .btn-clear-reproducers {
        background-color: #ff4d4d;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-top: 30px; /* Espacio debajo del formulario o lista */
        font-size: 0.9em;
        transition: background-color 0.3s ease;
        display: block; /* Para que ocupe su propia línea */
        margin-left: auto;
        margin-right: auto;
    }

    .btn-clear-reproducers:hover {
        background-color: #cc0000;
    }


    /* Estilos para la visualización de los reproductores guardados */
    .reproductores-guardados {
        margin-top: 50px;
        border-top: 1px solid #eee;
        padding-top: 30px;
    }

    .reproductores-guardados h3 {
        color: #003058;
        margin-bottom: 30px;
        font-size: 1.8em;
    }

    .lista-reproductores {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 25px;
        justify-content: center;
    }

    @keyframes glowing-border {
    0% {
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.2), 0 0 10px rgba(255, 255, 255, 0.2), 0 0 15px currentColor;
    }
    50% {
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.4), 0 0 30px currentColor;
    }
    100% {
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.2), 0 0 10px rgba(255, 255, 255, 0.2), 0 0 15px currentColor;
    }
}
    .reproductor-item {
        background-color: white;
        border-radius: 12px;
        padding: 20px 15px;
        box-shadow: 0 4px 15px rgba(223, 61, 158, 0.08);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        min-height: 250px; /* Para mantener un tamaño uniforme */
        transition: transform 0.3s ease, box-shadow 0.3s ease; /* Add transition for smooth effect */
        border: 2px solid #85d7ff; /* celeste suave */
        border-radius: 15px;
        box-shadow: 0 4px 15px rgba(223, 61, 158, 0.08);
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .reproductor-item:hover {
        border-color: #0099ff;
        box-shadow: 0 8px 25px rgba(77, 97, 197, 0.15);
    }

    .reproductor-item .circulo-reproductor:active {
        box-shadow:
            0 0 25px currentColor,
            0 0 40px currentColor,
            0 0 60px currentColor,
            inset 0 0 10px rgba(255, 255, 255, 0.2);
        transform: scale(0.97); /* efecto de presión */
    }
    .reproductor-item .circulo-reproductor {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        margin-bottom: 15px;
        box-shadow: inset 0 0 10px rgba(19, 178, 175, 0.4);
        animation: glowing-border 3s infinite alternate ease-in-out;
        transition: box-shadow 0.3s ease-in-out;
    }

    .reproductor-item .circulo-reproductor:hover {
        box-shadow: 0 0 15px currentColor, 0 0 25px currentColor, 0 0 40px currentColor, inset 0 0 10px rgba(0, 0, 0, 0.1);
    }

    .reproductor-item .circulo-interno {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background-color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        z-index: 2;
    }

    .reproductor-item .wave-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
        z-index: 1;
        border-radius: 50%;
    }
    .reproductor-item .wave-svg path {
        transition: stroke 0.3s ease;
    }

    /* ESTILOS PARA TODOS LOS SÍMBOLOS EN LOS LATERALES DEL CÍRCULO PRINCIPAL */
    .reproductor-item .symbol-reproductor-side {
        position: absolute;
        width: 25px; /* Símbolos más pequeños */
        height: 25px;
        object-fit: contain;
        z-index: 1; /* Por debajo del círculo interno */
        top: 50%;
        transform: translateY(-50%);
        filter: brightness(0) invert(1); /* Símbolos en reproductores SIEMPRE BLANCOS */
    }

    .reproductor-item .symbol-reproductor-left {
        left: 5px; /* Distancia desde el borde izquierdo del círculo de color */
    }

    .reproductor-item .symbol-reproductor-right {
        right: 5px; /* Distancia desde el borde derecho del círculo de color */
    }

    /* ELIMINAMOS .symbol-inside-circle YA QUE TODOS LOS SÍMBOLOS VAN LATERALES */

    .reproductor-item h4 {
        color: #003058;
        margin-bottom: 5px;
        font-size: 1.2em;
    }

    .reproductor-item p {
        font-size: 0.9em;
        color: #666;
        margin-bottom: 3px;
    }

    .reproductor-item .mood-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        font-size: 0.9em;
        color: #666;
        margin-bottom: 3px;
    }

    @media (max-width: 768px) {
        .form-crear-reproductor {
            grid-template-columns: 1fr;
        }
        .reproductor-compartido-container {
            padding: 20px;
            margin: 20px auto;
        }
    }
    .symbol-control2 {
        position: absolute;
        bottom: 15%;
        left: 47%;
        transform: translate(-80%, 40%);
        width: 20px;
        height: 20px;
        filter: brightness(0) invert(1); /* Para que sea blanco y contraste con el color del reproductor */
    }


    .symbol-control1 {
        position: absolute;
        bottom: 15%;
        left: 60%;
        transform: translate(-50%, 40%);
        width: 20px;
        height: 20px;
        filter: brightness(0) invert(1); /* Para que sea blanco y contraste con el color del reproductor */
    }

</style>

<div class="reproductor-compartido-container">
    <h2>Crea y Comparte tu Reproductor Musical</h2>
    <p>¡Arma tu propio reproductor con tu canción favorita y compártelo con el mundo!</p>

    <div class="form-crear-reproductor">
        <div class="form-group">
            <label for="userName">Tu Nombre / Apodo:</label>
            <input type="text" id="userName" bind:value={userName} />
        </div>

        <div class="form-group">
            <label for="songName">Nombre de la Canción:</label>
            <input
                type="text"
                id="songName"
                bind:value={songName}
                on:input={handleSongInput}
            />
            {#if songSuggestions.length > 0}
                <ul class="suggestions-list">
                    {#each songSuggestions as suggestion}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <li class="suggestion-item" on:click={() => selectSong(suggestion)}>
                            {suggestion}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <div class="form-group">
            <label for="artistName">Artista:</label>
            <input
                type="text"
                id="artistName"
                bind:value={artistName}
                on:input={handleArtistInput}
            />
            {#if artistSuggestions.length > 0}
                <ul class="suggestions-list">
                    {#each artistSuggestions as suggestion}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <li class="suggestion-item" on:click={() => selectArtist(suggestion)}>
                            {suggestion}
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>

        <div class="form-group">
            <label for="selectedGenre">Género Musical:</label>
            <input
                type="text"
                id="selectedGenre"
                bind:value={selectedGenre}
                on:input={handleGenreInput}
            />
            {#if genreSuggestions.length > 0}
                <ul class="suggestions-list">
                    {#each genreSuggestions as suggestion}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <li class="suggestion-item" on:click={() => selectGenre(suggestion)}>
                            {suggestion}
                        </li>
                    {/each}
                </ul>
            {/if}
            <div class="color-input-wrapper">
                <label for="selectedColor">Color del Género:</label>
                <input type="color" id="selectedColor" bind:value={selectedColor} />
            </div>
        </div>

        <div class="form-group">
            <label for="danzabilityInput">Danzabilidad (0-100):</label>
            <input
                type="number"
                id="danzabilityInput"
                bind:value={danzabilityInput}
                min="0"
                max="100"
            />
        </div>

        <div class="form-group">
            <label for="moodInput">Mood / Estado de Ánimo:</label>
            <input
                type="text"
                id="moodInput"
                bind:value={moodInput}
            />
        </div>

        <div class="form-group">
            <p>Tu Símbolo asignado:
                {#if isCalculatingSymbol && assignedSymbolText === ""} <span>Calculando...</span>
                {:else if assignedSymbolText !== ""}
                    <span class="bold-symbol-text">{assignedSymbolText}</span>
                    <img src={assignedSymbol} alt="Símbolo asignado" /> {:else}
                    <span></span>
                {/if}
            </p>
            <p class="description-symbol">{assignedSymbolDescription}</p>
        </div>

        <button class="btn-crear-reproductor" on:click={createReproducer}>
            ¡Crear Mi Reproductor!
        </button>
    </div>

    <div class="reproductores-guardados">
        <h3>Reproductores Creados por la Comunidad:</h3>
        {#if $userReproducers.length === 0}
            <p style="text-align:center;">¡Sé el primero en crear un reproductor personalizado!</p>
        {:else}
            <div class="lista-reproductores">
                {#each $userReproducers as reproducer (reproducer.id)}
                    <div class="reproductor-item">
                        <div
                            class="circulo-reproductor"
                            style="background-color: {reproducer.color};
                                   width: {obtenerDiametroReproductorUsuario()}px;
                                   height: {obtenerDiametroReproductorUsuario()}px;"
                        >
                            <img
                                src={reproducer.symbol}
                                alt="{reproducer.symbolText} izquierda"
                                class="symbol-reproductor-side symbol-reproductor-left"
                            />
                            <img
                                src={reproducer.symbol}
                                alt="{reproducer.symbolText} derecha"
                                class="symbol-reproductor-side symbol-reproductor-right"
                            />

                            <img src="/images/Pause.png" alt="Pause" class="symbol-control1" />
                            <img src="/images/Play.png" alt="Play" class="symbol-control2" />

                            <div class="circulo-interno">
                                <svg
                                    class="wave-svg"
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 100 30"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d={wavePathReproductorUsuario(reproducer.danzability)}
                                        fill="none"
                                        stroke={reproducer.color}
                                        stroke-width="{strokeWidthReproductorUsuario()}"
                                    />
                                </svg>
                            </div>
                        </div>

                        <h4>{reproducer.userName} - {reproducer.songName}</h4>
                        <p>{reproducer.artistName}</p>
                        <p>{reproducer.genre}</p>
                        <p>Danzabilidad: {reproducer.danzability}%</p>
                        <p class="mood-display">
                            Mood: {getMoodEmoji(reproducer.mood)} {reproducer.mood}
                        </p>
                    </div>
                {/each}
            </div>
            <button class="btn-clear-reproducers" on:click={clearReproducers}>
                Borrar Todos los Reproductores
            </button>
            {/if}
    </div>

    </div>