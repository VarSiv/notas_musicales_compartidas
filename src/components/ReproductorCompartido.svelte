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
        <ul class="playlist">
            {#each miPlaylistPersonalizada as cancion}
                <li style="background-color: {getColorForGenre(cancion.generos)}; color: white;">
                    {cancion.eligio} {cancion.nombre} - {cancion.artista} ({cancion.decada}) 🎧 Popularidad: {cancion.reproducciones}
                </li>
            {/each}
        </ul>
    {/if}
    </div>

<style>
.reproductor-container {
    max-width: 700px;
    margin: 30px auto;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

h2 {
    color: #003058;
}

button {
    padding: 10px 20px;
    background: #003058;
    color: white;
    border: none;
    border-radius: 5px;
    margin-bottom: 20px;
    cursor: pointer;
}

button:hover {
    background: #005088;
}

.formulario {
    margin-bottom: 20px;
}

input[type="text"] {
    padding: 8px;
    margin: 5px;
    width: 200px;
}

select, input[type="color"] {
    margin: 5px;
}

.simbolos label {
    margin: 0 5px;
    font-size: 24px;
}

.playlist {
    list-style: none;
    padding: 0;
}

.playlist li {
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
}
</style>
