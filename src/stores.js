// src/stores.js
import { writable } from 'svelte/store';

export const reproduccionesPorPersona = writable({
    // ¡CORRECCIÓN AQUÍ! Cada persona debe ser un objeto con 'count' y 'lastPlayedSong'
    Steffy: { count: 0, lastPlayedSong: null },
    Rosita: { count: 0, lastPlayedSong: null },
    Var: { count: 0, lastPlayedSong: null }
});