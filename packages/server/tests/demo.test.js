describe('Prueba de Integración de Jest', () => {
  
  test('Jest debería estar funcionando correctamente', () => {
    console.log('¡Jest está vivo!');
    expect(true).toBe(true);
  });

  test('La aritmética básica debería funcionar', () => {
    const suma = 1 + 1;
    expect(suma).toBe(2);
  });

});