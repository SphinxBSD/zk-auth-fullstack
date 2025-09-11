# Sistema de Autenticación con Pruebas de Conocimiento Cero

## Idea General

Un sistema de autenticación con pruebas de conocimiento cero permite a los usuarios demostrar que poseen credenciales válidas (email y contraseña) sin revelarlas al servidor. Esto se logra mediante:
1. Un **compromiso criptográfico** de las credenciales durante el registro
2. **Pruebas zk-SNARK** que demuestran conocimiento de las credenciales durante el login
3. **Verificación** de estas pruebas sin acceso a las credenciales originales

## Flujo Detallado

### 1. Fase de Registro

1. **Usuario proporciona credenciales**:
   - Nombre de usuario (público)
   - Email (privado)
   - Contraseña (privada)

2. **Cliente genera un compromiso**:
   - Calcula un hash criptográfico (ej: Poseidon, Pedersen) de las credenciales privadas
   - `compromiso = hash(email, contraseña, salt)`
   - Donde `salt` es un valor único por usuario (puede ser aleatorio o derivado del username)

3. **Cliente envía al servidor**:
   - Nombre de usuario (público)
   - Compromiso (público)
   - Salt (público, si se genera en el cliente)

4. **Servidor almacena**:
   - Nombre de usuario
   - Compromiso
   - Salt
   - (NUNCA almacena email o contraseña en texto plano)

### 2. Fase de Login

1. **Usuario ingresa credenciales**:
   - Nombre de usuario (público)
   - Email (privado)
   - Contraseña (privada)

2. **Cliente obtiene datos públicos**:
   - Solicita al servidor el compromiso y salt asociados al nombre de usuario

3. **Cliente genera prueba zk-SNARK**:
   - Ejecuta el circuito Noir con:
     - Entradas privadas: email, contraseña
     - Entradas públicas: salt, compromiso almacenado
   - Genera una prueba que demuestra que:
     `hash(email, contraseña, salt) == compromiso_almacenado`

4. **Cliente envía al servidor**:
   - Nombre de usuario
   - La prueba zk-SNARK
   - Las señales públicas (incluyendo el compromiso)

5. **Servidor verifica**:
   - Recupera el compromiso almacenado para ese usuario
   - Verifica que el compromiso en las señales públicas coincida con el almacenado
   - Verifica la prueba usando la clave de verificación (vk)
   - Si la prueba es válida, autentica al usuario

## Circuito Noir

El circuito sería similar a este:

```rust
// auth_circuit.nr
use dep::std::hash;

fn main(
    // Entradas privadas (conocidas solo por el usuario)
    email: Field,        // Email como campo (hash o representación numérica)
    password: Field,     // Contraseña como campo
    // Entradas públicas (conocidas por todos)
    salt: Field,         // Salt único
    stored_commitment: Field // Compromiso almacenado
) {
    // Combinar credenciales con salt
    let combined = hash::poseidon([email, password, salt]);
    
    // Verificar que el hash coincide con el compromiso almacenado
    assert(combined == stored_commitment);
}
```