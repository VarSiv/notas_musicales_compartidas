<script>
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import * as d3 from 'd3';

    // Importamos el store de afinidad de tu App.svelte
    // Asegúrate de que esta ruta sea correcta para tu proyecto
    import { reproduccionesPorPersona } from "../stores.js";

    // --- Datos para el autocompletado y colores ---
    // allSongsData ahora contendrá las canciones con Danzabilidad y Mood del CSV
    let allSongsData = [];

    // Definición de colores de género (copiado de tu App.svelte)
    const colorGenero = d3.scaleOrdinal()
        .domain(["Pop", "Rock", "Indie", "Electrónica", "Reggaetón", "Rap", "Balada", "Regional", "Trap", "Funk", "Cumbia Pop", "Rock Latino"]) // Ampliado con géneros de tu nuevo CSV
        .range(["#00CC66", "#CC0000", "#CC0066", "#001BCC", "#CCB400", "#000000", "#800080", "#FFA500", "#DAA520", "#FF1493", "#32CD32", "#6A5ACD"]); // Asegúrate de tener suficientes colores

    // Símbolos para el selector
    const simboloSelector = {
        "Var": "/images/Var.png",
        "Rosita": "/images/Rosita.png",
        "Steffy": "/images/Steffy.png",
        "Cruz": "/images/Cruz.png", // Asegúrate de tener esta imagen en public/images/
        "Igual": "/images/Igual.png" // Asegúrate de tener esta imagen en public/images/
    };

    // --- Stores para los reproductores creados ---
    // Los reproductores se guardan en localStorage para persistencia
    export const userReproducers = writable(JSON.parse(localStorage.getItem('userReproducers') || '[]'));

    userReproducers.subscribe(value => {
        localStorage.setItem('userReproducers', JSON.stringify(value));
    });

    // --- Variables del formulario ---
    let userName = "";
    let songName = "";
    let artistName = "";
    let selectedGenre = "";
    let selectedColor = "#00CC66"; // Color por defecto (verde para Pop)
    let danzabilityInput = 0; // Input para Danzabilidad
    let moodInput = "";        // Input para Mood
    let assignedSymbol = "";

    // Sugerencias para autocompletado
    let songSuggestions = [];
    let artistSuggestions = [];
    let genreSuggestions = [];

    // --- Lógica de carga de datos al iniciar el componente ---
    onMount(async () => {
        try {
            // Asegúrate que el nombre del archivo CSV sea correcto y la ruta
            allSongsData = await d3.csv("/cancionescompartidas.csv");
            console.log("Canciones compartidas cargadas:", allSongsData);

            // Actualizar el dominio de colorGenero con todos los géneros del CSV
            // Usar "Genero" con G mayúscula según tu CSV
            const uniqueGenresFromCsv = [...new Set(allSongsData.map(d => d.Genero).filter(Boolean))];
            colorGenero.domain(Array.from(new Set([...colorGenero.domain(), ...uniqueGenresFromCsv])));

            // Asignar símbolo inicial al cargar el componente
            assignSymbolBasedOnAfinity();

        } catch (error) {
            console.error("Error al cargar cancionescompartidas.csv:", error);
            // Puedes mostrar un mensaje al usuario si el CSV no se carga
        }
    });

    // --- Funciones de autocompletado ---
    function filterSuggestions(query, type) {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();

        if (type === 'song') {
            return allSongsData
                .filter(d => d.Cancion && d.Cancion.toLowerCase().includes(lowerQuery)) // Usar "Cancion" con C mayúscula
                .map(d => d.Cancion)
                .slice(0, 5);
        } else if (type === 'artist') {
            return [...new Set(allSongsData.filter(d => d.Artista && d.Artista.toLowerCase().includes(lowerQuery)) // Usar "Artista" con A mayúscula
                .map(d => d.Artista))]
                .slice(0, 5);
        } else if (type === 'genre') {
            return [...new Set(allSongsData.map(d => d.Genero))] // Usar "Genero" con G mayúscula
                .filter(g => g && g.toLowerCase().includes(lowerQuery))
                .slice(0, 5);
        }
        return [];
    }

    function handleSongInput(event) {
        songName = event.target.value;
        songSuggestions = filterSuggestions(songName, 'song');
        // Resetear artista, género, danzabilidad, mood si el nombre de la canción cambia
        artistName = "";
        selectedGenre = "";
        danzabilityInput = 0; // Resetear input de danzabilidad
        moodInput = "";        // Resetear input de mood
    }

    function selectSong(suggestion) {
        songName = suggestion;
        const foundSong = allSongsData.find(d => d.Cancion === suggestion); // Usar "Cancion"
        if (foundSong) {
            artistName = foundSong.Artista; // Usar "Artista"
            selectedGenre = foundSong.Genero; // Usar "Genero"
            selectedColor = colorGenero(selectedGenre); // Asigna el color del género encontrado
            danzabilityInput = +foundSong.Danzabilidad; // Asignar al input de danzabilidad
            moodInput = foundSong.Mood; // Asignar al input de mood
        }
        songSuggestions = []; // Limpiar sugerencias después de seleccionar
    }

    function handleArtistInput(event) {
        artistName = event.target.value;
        artistSuggestions = filterSuggestions(artistName, 'artist');
    }

    function selectArtist(suggestion) {
        artistName = suggestion;
        artistSuggestions = []; // Limpiar sugerencias después de seleccionar
    }

    function handleGenreInput(event) {
        selectedGenre = event.target.value;
        selectedColor = colorGenero(selectedGenre); // Actualiza el color en tiempo real
        genreSuggestions = filterSuggestions(selectedGenre, 'genre');
    }

    function selectGenre(suggestion) {
        selectedGenre = suggestion;
        selectedColor = colorGenero(selectedGenre); // Asigna el color del género seleccionado
        genreSuggestions = []; // Limpiar sugerencias después de seleccionar
    }

    // --- Lógica de asignación de símbolo basada en afinidad ---
    function assignSymbolBasedOnAfinity() {
        // Obtenemos el valor actual del store de afinidad
        const currentReproducciones = get(reproduccionesPorPersona);
        const total = currentReproducciones.Steffy + currentReproducciones.Rosita + currentReproducciones.Var;

        if (total > 0) {
            const afinidades = [
                { nombre: "Steffy", porcentaje: (currentReproducciones.Steffy / total) * 100, simbolo: simboloSelector.Steffy },
                { nombre: "Rosita", porcentaje: (currentReproducciones.Rosita / total) * 100, simbolo: simboloSelector.Rosita },
                { nombre: "Var", porcentaje: (currentReproducciones.Var / total) * 100, simbolo: simboloSelector.Var }
            ];
            // Ordenar por porcentaje de mayor a menor
            afinidades.sort((a, b) => b.porcentaje - a.porcentaje);

            const top1 = afinidades[0];
            const top2 = afinidades[1];

            // Si los dos primeros tienen el mismo porcentaje (empate)
            if (top1.porcentaje === top2.porcentaje) {
                assignedSymbol = simboloSelector.Igual; // Asignar el símbolo de "Igual"
            } else {
                assignedSymbol = top1.simbolo; // Asignar el símbolo del que tiene mayor afinidad
            }
        } else {
            // Si no se ha jugado (total de reproducciones es 0)
            assignedSymbol = simboloSelector.Cruz; // Asignar el símbolo de "Cruz"
        }
    }

    // Reactividad: la función se ejecuta cada vez que 'reproduccionesPorPersona' cambia
    $: {
        assignSymbolBasedOnAfinity();
    }


    // --- Función para crear un nuevo reproductor ---
    function createReproducer() {
        if (!userName || !songName || !artistName || !selectedGenre || !danzabilityInput || !moodInput) {
            alert("Por favor, completa todos los campos: Nombre/Apodo, Canción, Artista, Género, Danzabilidad y Mood.");
            return;
        }

        // Asegurarse de que danzabilityInput es un número válido
        const finalDanzability = Math.max(0, Math.min(100, parseInt(danzabilityInput) || 0)); // Entre 0 y 100

        const newReproducer = {
            id: Date.now(), // ID único basado en la marca de tiempo
            userName,
            songName,
            artistName,
            genre: selectedGenre,
            color: selectedColor,
            danzability: finalDanzability, // Usar el valor del input
            mood: moodInput,             // Usar el valor del input
            symbol: assignedSymbol       // Guardar el símbolo asignado
        };

        // Actualizar el store con el nuevo reproductor
        userReproducers.update(currentReproducers => [...currentReproducers, newReproducer]);

        // Limpiar formulario después de crear
        userName = "";
        songName = "";
        artistName = "";
        selectedGenre = "";
        selectedColor = colorGenero("Pop"); // Vuelve al color por defecto para el próximo
        danzabilityInput = 0;
        moodInput = "";
    }

    // --- Función para borrar todos los reproductores guardados ---
    function clearReproducers() {
        if (confirm("¿Estás seguro de que quieres borrar TODOS los reproductores creados? Esta acción es irreversible.")) {
            userReproducers.set([]); // Establece el store a un array vacío
            console.log("Reproductores borrados de localStorage.");
        }
    }

    // --- Lógica para el círculo del reproductor (igual que en App.svelte) ---
    function obtenerDiametroReproductorUsuario() {
        return 120; // Diámetro fijo para los reproductores creados por el usuario
    }

    function wavePathReproductorUsuario(danzability) {
        // Adaptamos la lógica de wavePath de tu componente principal
        const danceability = parseFloat(danzability || 50); // Si no hay danzability, usa 50
        const maxAmplitude = 6;
        const baseAmplitude = 1;
        const amplitude =
            baseAmplitude + (maxAmplitude - baseAmplitude) * (danceability / 100);

        const minFrequency = 0.0;
        const maxFrequency = 0.65;
        const frequency =
            minFrequency + (maxFrequency - minFrequency) * (danceability / 100);

        const width = 100; // Ancho virtual para el path
        const baseY = width * 0.16; // Posición vertical base de la onda

        let d = `M 0 ${baseY}`;
        for (let x = 0; x < width; x += 1) {
            const waveY = Math.sin(x * frequency)
            const y = baseY + waveY * amplitude
            d += ` L ${x} ${y}`
        }
        return d
    }

    function strokeWidthReproductorUsuario() {
        return 2; // Ancho de la línea de la onda
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
            default: return '🎧'; // Emoji por defecto
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
        font-weight: bold;
    }

    .current-symbol img {
        width: 30px;
        height: 30px;
        margin-left: 10px;
        vertical-align: middle;
        object-fit: contain; /* Para que el símbolo se vea bien */
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

    .reproductor-item {
        background-color: white;
        border-radius: 12px;
        padding: 20px 15px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        min-height: 250px; /* Para mantener un tamaño uniforme */
    }

    .reproductor-item .circulo-reproductor {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        display: flex; /* Asegura que `.circulo-reproductor` sea un flex container */
        align-items: center; /* Centra verticalmente el contenido */
        justify-content: center; /* Centra horizontalmente el `.circulo-interno` */
        position: relative; /* ¡MUY IMPORTANTE! Establece este div como el contexto para el posicionamiento absoluto de las cruces */
        overflow: hidden; /* Oculta partes que se salgan si las cruces son muy grandes o están muy al borde */
        margin-bottom: 15px;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.1); /* Efecto de sombra interior para profundidad */
    }

    .reproductor-item .circulo-interno {
        width: 50px; /* Tamaño del círculo blanco central */
        height: 50px;
        border-radius: 50%;
        background-color: white;
        display: flex; /* Usamos flexbox para centrar contenido */
        align-items: center; /* Centra verticalmente */
        justify-content: center; /* Centra horizontalmente */
        position: relative; /* Importante para el posicionamiento absoluto del símbolo y la onda */
        overflow: hidden;
        z-index: 2; /* Asegura que el círculo interno esté sobre las cruces si se superponen */
    }

    .reproductor-item .wave-svg {
        position: absolute; /* Para que el SVG se posicione sobre el círculo interno */
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
        z-index: 1; /* La onda debería estar detrás del símbolo, pero dentro de su contenedor */
        /* Aseguramos que la onda no se extienda fuera del círculo interno */
        border-radius: 50%;
    }
    .reproductor-item .wave-svg path {
        transition: stroke 0.3s ease;
    }

    /* NUEVOS ESTILOS PARA LAS CRUCES LATERALES */
    .reproductor-item .symbol-reproductor-left,
    .reproductor-item .symbol-reproductor-right {
        position: absolute; /* Posicionamiento absoluto respecto a .circulo-reproductor */
        width: 25px; /* Tamaño del símbolo */
        height: 25px;
        object-fit: contain;
        z-index: 1; /* Por debajo del círculo interno si se superpone */
        top: 50%; /* Centra verticalmente */
        transform: translateY(-50%); /* Ajuste fino para centrado vertical */
    }

    .reproductor-item .symbol-reproductor-left {
        left: 5px; /* Distancia desde el borde izquierdo del círculo de color */
    }

    .reproductor-item .symbol-reproductor-right {
        right: 5px; /* Distancia desde el borde derecho del círculo de color */
    }

    /* ESTILOS PARA OTROS SÍMBOLOS DENTRO DEL CÍRCULO BLANCO (si los hubiera) */
    /* Si la cruz era el único símbolo que iba aquí, puedes eliminar esta clase.
       Si otros símbolos deben ir dentro del círculo blanco, aquí es donde irían sus estilos. */
    .reproductor-item .symbol-inside-circle {
        width: 35px; /* Tamaño del símbolo dentro del círculo blanco */
        height: 35px;
        object-fit: contain;
        z-index: 3; /* Asegura que esté por encima de la onda */
        /* Estas propiedades ya no son necesarias si el padre .circulo-interno es flex y centra */
        /* position:left; */
    }


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
    filter: brightness(0) invert(1);
}

.symbol-control1 {
    position: absolute;
    bottom: 15%; 
    left: 60%;
    transform: translate(-50%, 40%);
    width: 20px;
    height: 20px;
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
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
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
            <p>Tu Símbolo asignado:</p>
            <div class="current-symbol">
                {#if assignedSymbol}
                    <img src={assignedSymbol} alt="Símbolo" />
                {:else}
                    <span>Calculando...</span>
                {/if}
            </div>
            <p class="description-symbol">Este símbolo se asigna automáticamente según tu afinidad en nuestro juego musical. Si no jugaste, se te asignará una cruz y si hubo empate, se te asigna un igual.</p>
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
                            {#if reproducer.symbol === simboloSelector.Cruz}
                                <img
                                    src={reproducer.symbol}
                                    alt="Cruz izquierda"
                                    class="symbol-reproductor-left"
                                />
                            {/if}

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
                                        stroke-width={strokeWidthReproductorUsuario()}
                                        stroke-linecap="round"
                                        vector-effect="non-scaling-stroke"
                                    />
                                </svg>
                                {#if reproducer.symbol !== simboloSelector.Cruz && reproducer.symbol}
                                     <img
                                         src={reproducer.symbol}
                                         alt="Símbolo del usuario"
                                         class="symbol-inside-circle"
                                     />
                                 {/if}
                            </div>

                            {#if reproducer.symbol === simboloSelector.Cruz}
                                <img
                                    src={reproducer.symbol}
                                    alt="Cruz derecha"
                                    class="symbol-reproductor-right"
                                />
                            {/if}
                        </div>
                        <h4>{reproducer.songName}</h4>
                        <p><strong>Artista:</strong> {reproducer.artistName}</p>
                        <p><strong>Género:</strong> {reproducer.genre}</p>
                        <p><strong>Danzabilidad:</strong> {reproducer.danzability}%</p>
                        <p class="mood-display">
                            <strong>Mood:</strong>
                            {reproducer.mood} {getMoodEmoji(reproducer.mood)}
                        </p>
                        <p><strong>Creado por:</strong> {reproducer.userName}</p>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <button class="btn-clear-reproducers" on:click={clearReproducers}>
        Borrar Todos los Reproductores
    </button>
</div>