use std::hash::pedersen_hash;

fn main(
    // Entradas privadas
    email: Field,
    password: Field,
    // Entradas publicas
    salt: pub Field,
    stored_commitment: pub Field
) {
    // Combinar credenciales con salt
    let combined = pedersen_hash([email, password, salt]);
    assert_eq(combined, stored_commitment);
}

