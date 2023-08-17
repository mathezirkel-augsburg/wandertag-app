#[macro_use]
extern crate log;

mod database;
mod db;
mod error_handler;
mod models;

use actix_cors::Cors;
use actix_web::{
    http::header, http::header::ContentType, middleware, web, App, HttpResponse, HttpServer,
    Responder,
};
use dotenv::dotenv;
use serde::Serialize;
use std::collections::HashMap;
use std::env;

#[derive(Serialize)]
struct RedeemResponse {
    success: bool,
}

async fn init_route() -> impl Responder {
    debug!("Init");
    HttpResponse::Ok()
        .content_type(ContentType::plaintext())
        .body("works")
}
async fn upload_route() -> impl Responder {
    debug!("Uploaded");
    let response = RedeemResponse { success: false };

    web::Json(response)
}
async fn request_route(query: web::Query<HashMap<String, String>>) -> impl Responder {
    debug!("Requested");
    let secret = query.get("secret").map_or("", String::as_str).clone();
    let comparison =
        env::var("GET_DATA_SECRET").expect("Value ('GET_DATA_SECRET') not set in .env");

    let mut access: bool = false;
    if secret == comparison {
        access = true;
    }

    if access {
        HttpResponse::Ok()
            .content_type(ContentType::json())
            .body("[]")
    } else {
        HttpResponse::Ok()
            .content_type(ContentType::json())
            .body("[]")
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    dotenv().ok();
    db::init();

    let server = HttpServer::new(move || {
        App::new()
            .wrap(
                Cors::default()
                    .allow_any_origin()
                    .allowed_methods(vec!["POST", "GET"])
                    .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT])
                    .allowed_header(header::CONTENT_TYPE)
                    .supports_credentials()
                    .max_age(3600),
            )
            .wrap(middleware::Compress::default())
            .wrap(middleware::Logger::default())
            .service(web::resource("/").route(web::get().to(init_route)))
            .service(web::resource("/log-data").route(web::post().to(upload_route)))
            .service(web::resource("/request-data").route(web::get().to(request_route)))
    });

    let server_host =
        env::var("WEBSERVER_HOST").expect("Webserver host ('WEBSERVER_HOST') not set in .env");
    let server_port =
        env::var("WEBSERVER_PORT").expect("Webserver port ('WEBSERVER_PORT') not set in .env");

    info!("Server started on http://{}:{}", server_host, server_port);

    server
        .bind(format!("{}:{}", server_host, server_port))
        .unwrap()
        .run()
        .await
}
