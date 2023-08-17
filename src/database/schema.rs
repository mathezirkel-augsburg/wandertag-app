// @generated automatically by Diesel CLI.

diesel::table! {
    datapoints (id) {
        id -> Int4,
        lat -> Float4,
        lon -> Float4,
        time -> Int8,
        ident -> Int4,
    }
}
