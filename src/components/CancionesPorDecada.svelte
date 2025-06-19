<script>
  export let decada
  export let canciones
  export let colorGenero
  export let obtenerDiametro
  export let iconosPlayPause
  export let simboloSelector
  import { onMount } from "svelte"
  import { reproduccionesPorPersona } from "../stores.js"; // Importa el store

  let audio = new Audio()
  let currentlyPlaying = null

  // Variable para controlar la canción activa y mostrar su información
  let activeSongInfo = null; // Almacenará la canción para mostrar el pop-up

  if (!window.audioGlobal) {
      window.audioGlobal = new Audio()
      window.audioGlobal.currentlyPlaying = null
  }

  // Función para manejar el clic en la canción
  function handleClickCancion(cancion) {
      // 1. Lógica de reproducción
      const audio = window.audioGlobal
      const path = `/canciones/${cancion.canciones}.mp3`

      if (audio.currentlyPlaying === cancion.canciones) {
          audio.pause()
          audio.currentTime = 0
          audio.currentlyPlaying = null
          activeSongInfo = null; // Cierra el pop-up si se pausa la misma canción
          return
      }

      audio.pause()
      audio.currentTime = 0
      audio.src = path
      currentlyPlaying = cancion.canciones
      audio.load()

      audio
          .play()
          .then(() => {
              audio.currentlyPlaying = cancion.canciones
              // 2. Mostrar la información de la canción
              activeSongInfo = cancion; // Asigna la canción para que se muestre el pop-up
          })
          .catch(error => {
              console.error("Error playing audio:", error)
              audio.currentlyPlaying = null
              activeSongInfo = null;
          })

      audio.onended = () => {
          audio.currentlyPlaying = null
          activeSongInfo = null; // Cierra el pop-up al finalizar la reproducción
      }

      // 3. Registrar la "votación" (incrementar el contador en el store)
      // Puedes considerar que un simple clic en la canción ya cuenta como "voto" o "interacción positiva"
      // O podrías tener un botón explícito dentro del pop-up.
      // Por ahora, lo haremos al hacer clic para reproducir/abrir info:
      $reproduccionesPorPersona[cancion.eligio]++;
     
  }

  // Función para manejar el clic en el botón "Me Gusta" dentro del pop-up
  function handleLikeClick(cancion) {
      // Aquí podríamos añadir lógica si queremos que el "like" sea diferente del "play"
      // Por ahora, simplemente cerramos el pop-up.
      console.log(`Usuario le dio "Me Gusta" a ${cancion.canciones}`);
      // Si el "like" debe incrementar el contador solo una vez por canción por usuario,
      // necesitaríamos un sistema de IDs de usuario o cookies, lo cual complejizaría.
      // Por simplicidad, ya lo estamos incrementando en handleClickCancion.
      activeSongInfo = null; // Cierra el pop-up
  }

  // Cerrar el pop-up si se hace clic fuera de él (opcional, pero mejora UX)
  function closePopupOnClickOutside(event) {
      const popup = document.querySelector('.cancion-info-popup');
      const songCircles = document.querySelectorAll('.cancion');
      let clickedInsidePopup = popup && popup.contains(event.target);
      let clickedOnSongCircle = Array.from(songCircles).some(circle => circle.contains(event.target));

      if (activeSongInfo && !clickedInsidePopup && !clickedOnSongCircle) {
          activeSongInfo = null;

      }
  }

  onMount(() => {
      // Añadir el listener al body para cerrar el pop-up al hacer clic fuera
      document.body.addEventListener('click', closePopupOnClickOutside);

      // Limpiar el listener al destruir el componente
      return () => {
          document.body.removeEventListener('click', closePopupOnClickOutside);
      };
  });


  function wavePath(cancion, diametro) {
      const danceability = parseFloat(cancion.danceability || 50)
      const maxAmplitude = 6
      const baseAmplitude = 1
      const amplitude =
          baseAmplitude + (maxAmplitude - baseAmplitude) * (danceability / 100)

      // Frequency based on danceability
      const minFrequency = 0.0 
      const maxFrequency = 0.65 
      const frequency =
          minFrequency + (maxFrequency - minFrequency) * (danceability / 100)

      const width = 100
      const baseY = width * 0.16

      let d = `M 0 ${baseY}`
      for (let x = 0; x < width; x += 1) {
          const waveY = Math.sin(x * frequency)
          const y = baseY + waveY * amplitude
          d += ` L ${x} ${y}`
      }

      return d
  }

  function strokeWidth(diametro) {
      // Stroke width scaling
      const minStroke = 0.5;
      const maxStroke = 3;
      const maxDiametro = 150;
      const clampedDiametro = Math.min(diametro, maxDiametro);
      const strokeWidth = minStroke + (maxStroke - minStroke) * (clampedDiametro / maxDiametro);
      return strokeWidth
  }

  // Calcular número de filas basado en 4 canciones por fila
  $: filas = Math.ceil(canciones.length / 4);
</script>

<div class="fila-con-decada">
  {#if canciones.length > 0}
      <div class="decada-label" style="--filas: {filas}">{decada}</div>
  {/if}

  <div class="grid-canciones" style="grid-template-rows: repeat({filas}, 1fr);">

      {#each canciones as cancion (cancion.canciones)}
          {@const diametro = obtenerDiametro(cancion.reproducciones) * 0.88}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div class="cancion-wrapper" data-cancion={cancion.canciones}>
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                  class="cancion"
                  on:click={() => handleClickCancion(cancion)}
                  style="
                      width: {diametro}px;
                      height: {diametro}px;
                      background-color: {colorGenero(cancion.generos)};
                      font-size: {diametro * 0.1}px;
                  "
              >
                  <div
                      class="circulo-blanco"
                      style="width: {diametro * 0.4}px; height: {diametro * 0.4}px;"
                  >
                      <div
                          class="wave-container"
                          style="width: 100%; height: 100%; position: relative;"
                      >
                          <svg
                              width="100%"
                              height="100%"
                              viewBox="0 0 100 30"
                              preserveAspectRatio="none"
                          >
                              <path
                                  d={wavePath(cancion, diametro)}
                                  fill="none"
                                  stroke={colorGenero(cancion.generos)}
                                  stroke-width={strokeWidth(diametro)}
                                  stroke-linecap="round"
                                  vector-effect="non-scaling-stroke"
                              />
                          </svg>
                      </div>
                  </div>

                  {#if +cancion.billboard !== 0}
                      <div class="billboard" style="font-size: {diametro * 0.15}px;">
                          {cancion.billboard}
                      </div>
                  {/if}

                  <div class="iconos" style="font-size: {diametro * 0.1}px;">
                      <img
                          src={iconosPlayPause.play}
                          alt="Play"
                          style="width: {diametro * 0.12}px"
                      />
                      <img
                          src={iconosPlayPause.pause}
                          alt="Pause"
                          style="width: {diametro * 0.12}px"
                      />
                  </div>

                  <img
                      class="selector selector-derecho"
                      src={simboloSelector[cancion.eligio]}
                      alt={cancion.eligio}
                      style="width: {diametro * 0.12}px; height: {diametro * 0.12}px;"
                  />

                  <img
                      class="selector selector-izquierdo"
                      src={simboloSelector[cancion.eligio]}
                      alt={cancion.eligio}
                      style="width: {diametro * 0.12}px; height: {diametro * 0.12}px;"
                  />
              </div>

              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <div class="nombre-cancion">{cancion.canciones}</div>
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                  class="nombre-artista"
                  on:click={() => window.open(cancion.youtube, "_blank")}
              >
                  {cancion.artistas}
              </div>
          </div>
      {/each}
  </div>
</div>

{#if activeSongInfo}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="cancion-info-overlay" on:click|self={closePopupOnClickOutside}>
      <div class="cancion-info-popup">
          <button class="close-popup" on:click={() => { activeSongInfo = null; if (window.audioGlobal.currentlyPlaying) { window.audioGlobal.pause(); window.audioGlobal.currentTime = 0; window.audioGlobal.currentlyPlaying = null; } }}>&times;</button>
          <h3>{activeSongInfo.canciones} - {activeSongInfo.artistas}</h3>
          <p><strong>Género:</strong> {activeSongInfo.generos}</p>
          <p><strong>Ritmo:</strong> {parseFloat(activeSongInfo.danceability) >= 70 ? 'Muy bailable' : parseFloat(activeSongInfo.danceability) >= 50 ? 'Bailable' : 'Melódico/Lento'}.</p>
          <p><strong>Elegida por:</strong> {activeSongInfo.eligio}.</p>
          
          <button class="vote-button" on:click={() => handleLikeClick(activeSongInfo)}>¡Me Gusta esta Canción!</button>
      </div>
  </div>
{/if}

<style>
 
  .wave-container {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 50%;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
  }

  .circulo-blanco {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border-radius: 50%;
      background-color: white;
      z-index: 2;
      overflow: hidden;
  }
  .cancion-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      margin: 0 auto; /* Center inside the grid cell */
  }

  /* Estilos para el pop-up de información de la canción */
  .cancion-info-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000; /* Asegura que esté encima de todo */
  }

  .cancion-info-popup {
      background-color: white;
      padding: 30px;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      text-align: center;
      max-width: 450px;
      width: 90%;
      position: relative;
      color: #333;
      font-family: 'Raleway', sans-serif;
  }

  .cancion-info-popup h3 {
      color: #003058;
      font-size: 1.8em;
      margin-bottom: 15px;
  }

  .cancion-info-popup p {
      font-size: 1.1em;
      margin-bottom: 10px;
      line-height: 1.5;
      text-align: center; /* Centrar el texto en el pop-up */
      max-width: none; /* Eliminar el max-width de p global */
  }

  .close-popup {
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 1.8em;
      cursor: pointer;
      color: #888;
      transition: color 0.2s ease;
  }

  .close-popup:hover {
      color: #333;
  }

  /* Botón de votar dentro del pop-up */
  .cancion-info-popup .vote-button {
      background-color: #15FB88;
      color: #000;
      padding: 12px 25px;
      border: none;
      border-radius: 25px;
      font-weight: bold;
      cursor: pointer;
      font-size: 1em;
      transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
      margin-top: 20px;
      box-shadow: 0 4px 8px rgba(21, 251, 136, 0.4);
  }

  .cancion-info-popup .vote-button:hover {
      background-color: #00CC66;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 204, 102, 0.5);
  }
</style>
