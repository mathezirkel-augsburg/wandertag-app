use crate::database::datapoints;
use crate::db;
use crate::error_handler::CustomError;
use diesel::prelude::*;
use diesel::Insertable;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, AsChangeset, Insertable, Queryable)]
#[diesel(table_name = datapoints)]
pub struct InsertDatapoint {
    pub lat: f32,
    pub lon: f32,
    pub time: i64,
    pub ident: i32,
}

#[derive(Serialize, Deserialize, AsChangeset, Queryable)]
#[diesel(table_name = datapoints)]
pub struct Datapoint {
    pub id: i32,
    pub lat: f32,
    pub lon: f32,
    pub time: i64,
    pub ident: i32,
}
impl Datapoint {
    pub fn find_all() -> Result<Vec<Self>, CustomError> {
        Ok(datapoints::table.load::<Datapoint>(&mut db::connection()?)?)
    }

    pub fn find(id: i32) -> Result<Self, CustomError> {
        Ok(datapoints::table
            .filter(datapoints::id.eq(id))
            .first(&mut db::connection()?)?)
    }

    pub fn create(datapoint: InsertDatapoint) -> Result<Self, CustomError> {
        Ok(diesel::insert_into(datapoints::table)
            .values(datapoint)
            .get_result(&mut db::connection()?)?)
    }
}
