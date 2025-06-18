import { writable } from 'svelte/store';

// Este store guardará un objeto donde las claves serán 'Steffy', 'Rosita', 'Var'
// y los valores serán el conteo de canciones reproducidas de cada persona.
export const reproduccionesPorPersona = writable({
    Steffy: 0,
    Rosita: 0,
    Var: 0
});
