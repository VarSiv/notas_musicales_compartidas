preview_url: track.preview_url,

miPlaylistPersonalizada = data.items.map(track => ({
    id: track.id,
    nombre: track.name,
    artista: track.artists.map(a => a.name).join(", "),
    decada: track.album.release_date ? `${Math.floor(parseInt(track.album.release_date.substring(0,4))/10)*10}s` : "Desconocida",
    reproducciones: track.popularity,
    generos: generoSeleccionadoColor,
    eligio: usarSimboloAleatorio ? getRandomSimbolo() : simboloSelector[simboloSeleccionadoPersonalizado],
    creador: tuNombre || "Anónimo",
    preview_url: track.preview_url
}));

console.log("Tracks recibidos:", data.items);
