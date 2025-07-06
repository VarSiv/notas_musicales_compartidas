preview_url: track.preview_url,

// En tu archivo principal (donde llamas a getTopTracks y defines miPlaylistPersonalizada)
async function getTopTracks(token) {
    const res = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=3", {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
        console.error("Error al obtener top tracks:", res.status, res.statusText);
        alert("Error al obtener tus canciones principales. ¿Tu token sigue siendo válido?");
        localStorage.removeItem("access_token");
        return;
    }

    const data = await res.json();

    if (data.items) {
        miPlaylistPersonalizada = data.items.slice(0, 3).map(track => ({ // Limitamos a 3 para el top 3
            id: track.id,
            canciones: track.name, // Mapeado a 'canciones' para el componente
            artistas: track.artists.map(a => a.name).join(", "), // Mapeado a 'artistas'
            // Decada: track.album.release_date ? `${Math.floor(parseInt(track.album.release_date.substring(0,4))/10)*10}s` : "Desconocida",
            reproducciones: track.popularity, // Popularidad como proxy de reproducciones
            generos: generoSeleccionadoColor, // O la lógica para determinar el género real de Spotify
            // Esto es importante: el simbolo que va en el circulo
            eligio: obtenerSimboloAfinidad(), // Usamos la función que determina el símbolo de afinidad
            creador: tuNombre || "Anónimo",
            preview_url: track.preview_url, // URL de preview de Spotify
            external_url: track.external_urls.spotify, // URL para abrir en Spotify
            billboard: track.popularity // Puedes usar popularidad como un "billboard" si quieres mostrar un número
        }));
    } else {
        miPlaylistPersonalizada = [];
    }
}
