import { describe, test, expect } from 'vitest';

describe('Prueba inicial de Frontend', () => {
  
  test('TypeScript debería compilar y sumar números', () => {
    const numero: number = 5;
    expect(numero + 5).toBe(10);
  });

  test('JSDOM debería simular el navegador', () => {
    // Esto fallaría si no hubiéramos configurado environment: 'jsdom'
    const elemento = document.createElement('div');
    elemento.id = 'prueba';
    document.body.appendChild(elemento);

    expect(document.getElementById('prueba')).not.toBeNull();
  });
});