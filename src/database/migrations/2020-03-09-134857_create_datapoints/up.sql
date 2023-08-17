
CREATE TABLE "datapoints"
(
    id SERIAL PRIMARY KEY,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    time BIGINT NOT NULL,
    ident INT NOT NULL
)
