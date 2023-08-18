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
use models::{Datapoint, InsertDatapoint};
use serde::Serialize;
use std::collections::HashMap;
use std::env;
use std::fmt::Write;

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
async fn upload_route(data: web::Form<HashMap<String, String>>) -> impl Responder {
    debug!("Uploaded");

    let mut result: HashMap<String, HashMap<String, String>> = HashMap::new();

    for (key, value) in data.0 {
        let parts: Vec<&str> = key.split('[').collect();
        if parts.len() == 2 {
            let key_part = parts[0].to_string();
            let info_part = parts[1].trim_end_matches(']').to_string();

            let entry = result.entry(key_part).or_insert_with(HashMap::new);
            entry.insert(info_part, value);
        }
    }

    for (_, value) in result {
        let dp = InsertDatapoint {
            ident: value.get("ident").unwrap().parse::<i32>().unwrap(),
            lat: value.get("lat").unwrap().parse::<f32>().unwrap(),
            lon: value.get("lon").unwrap().parse::<f32>().unwrap(),
            time: value.get("time").unwrap().parse::<i64>().unwrap(),
        };

        Datapoint::create(dp).unwrap();
    }

    let response = RedeemResponse { success: true };
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
        let mut output: String = String::from("[\n");

        for point in Datapoint::find_all().unwrap() {
            write!(
                output,
                "[{}, {}, {}, {}],\n",
                point.ident, point.time, point.lat, point.lon
            )
            .unwrap();
        }

        output.pop();
        output.pop();
        write!(output, "\n]").unwrap();

        HttpResponse::Ok()
            .content_type(ContentType::json())
            .body(output)
    } else {
        HttpResponse::Unauthorized().finish()
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
