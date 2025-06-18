// src/stores.js
import { writable } from 'svelte/store';

export const reproduccionesPorPersona = writable({
    Steffy: { count: 0, lastPlayedSong: null }, // Ahora es un objeto con count y lastPlayedSong
    Rosita: { count: 0, lastPlayedSong: null },
    Var: { count: 0, lastPlayedSong: null }
});
