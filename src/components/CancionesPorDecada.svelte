<script>
  export let decada
  export let canciones
  export let colorGenero
  export let obtenerDiametro
  export let iconosPlayPause
  export let simboloSelector
  import {onMount} from "svelte"

  let audio = new Audio()
  let currentlyPlaying = null

  if (!window.audioGlobal) {
    window.audioGlobal = new Audio()
    window.audioGlobal.currentlyPlaying = null
  }
  function playCancion(nombre) {
    const audio = window.audioGlobal
    const path = `/canciones/${nombre}.mp3`

    // If same song is clicked again, pause it
    if (audio.currentlyPlaying === nombre) {
      audio.pause()
      audio.currentTime = 0 // Reset to beginning
      audio.currentlyPlaying = null
      return
    }

    // Always pause and reset current audio first
    audio.pause()
    audio.currentTime = 0

    // Set new source and play
    audio.src = path
    currentlyPlaying = nombre // Set this before play() to prevent race conditions

    // Use async/await or promise to ensure proper sequencing
    audio.load()

    audio
      .play()
      .then(() => {
        // Play started successfully
        audio.currentlyPlaying = nombre
      })
      .catch(error => {
        console.error("Error playing audio:", error)
        audio.currentlyPlaying = null
      })

    audio.onended = () => {
      audio.currentlyPlaying = null
    }
  }


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
      <div class="cancion-wrapper" data-cancion={cancion.canciones}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          class="cancion"
          on:click={() => playCancion(cancion.canciones)}
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
            <!-- Wave animation container -->
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

        <div class="nombre-cancion">{cancion.canciones}</div>
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
</style>
