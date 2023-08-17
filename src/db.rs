use crate::error_handler::CustomError;
use diesel::pg::PgConnection;
use diesel::r2d2::ConnectionManager;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use lazy_static::lazy_static;
use r2d2;
use std::env;
use std::time::Duration;

type Pool = r2d2::Pool<ConnectionManager<PgConnection>>;
pub type DbConnection = r2d2::PooledConnection<ConnectionManager<PgConnection>>;
pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./src/database/migrations");

lazy_static! {
    static ref POOL: Pool = {
        let db_host =
            env::var("DATABASE_HOST").expect("Database host ('DATABASE_HOST') not set in .env");
        let db_port =
            env::var("DATABASE_PORT").expect("Database port ('DATABASE_PORT') not set in .env");
        let db_user =
            env::var("DATABASE_USER").expect("Database user ('DATABASE_USER') not set in .env");
        let db_password = env::var("DATABASE_PASSWORD")
            .expect("Database password ('DATABASE_PASSWORD') not set in .env");
        let db_name =
            env::var("DATABASE_NAME").expect("Database name ('DATABASE_NAME') not set in .env");

        let manager = ConnectionManager::<PgConnection>::new(format!(
            "postgres://{}:{}@{}:{}/{}",
            db_user, db_password, db_host, db_port, db_name
        ));
        Pool::builder()
            .connection_timeout(Duration::from_secs(3))
            .max_size(8)
            .build(manager)
            .expect("Failed to create db pool")
    };
}

pub fn init() {
    lazy_static::initialize(&POOL);
    let mut conn = connection().expect("Failed to get db connection");
    conn.run_pending_migrations(MIGRATIONS).unwrap();
}

pub fn connection() -> Result<DbConnection, CustomError> {
    POOL.get()
        .map_err(|e| CustomError::new(500, format!("Failed getting db connection: {}", e)))
}
