use std::hash::pedersen_hash;

fn main(
    // Entradas privadas
    email: Field,
    password: Field,
    // Entradas publicas
    salt: pub Field,
) -> pub Field{
    // Combinar credenciales con salt
    let combined = pedersen_hash([email, password, salt]);
    combined
}