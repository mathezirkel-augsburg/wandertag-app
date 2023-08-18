let password = "";
let points = [];
let map;

$(document).ready(() => {
    let stored_password = localStorage.getItem("stored_password"); // very secure I know. Peak development

    if (stored_password != undefined && stored_password != null) {
        $("#password_input").val(stored_password);
        password = stored_password;

        get_points();
    }

    $("#password_input").on("change", function () {
        let pass = $("#password_input").val();
        localStorage.setItem("stored_password", pass);
        password = pass;

        get_points();
    });

    const Map = window.ol.Map;
    const View = window.ol.View;
    const TileLayer = window.ol.layer.Tile;
    const OSM = window.ol.source.OSM;
    const Polyline = window.ol.format.Polyline;
    const Feature = window.ol.Feature;
    const Style = window.ol.style.Style;
    const Stroke = window.ol.style.Stroke;
    const VectorSource = window.ol.source.Vector;
    const VectorLayer = window.ol.layer.Vector;

    // inti map
    map = new Map({
        layers: [
            new TileLayer({
                source: new OSM(),
            }),
        ],
        target: "map",
        view: new View({
            center: [0, 0],
            zoom: 14,
            center: osm_coordinates(48.45357177939096, 10.60930317960719),
        }),
    });

    const route = new Polyline({
        factor: 1e5,
    }).readGeometry(
        polyline.encode([
            [48.402, 10.598],
            [48.383, 10.871],
        ]),
        {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
        }
    );

    const routeFeature = new Feature({
        type: "route",
        geometry: route,
    });

    const styles = {
        route: new Style({
            stroke: new Stroke({
                width: 5,
                color: [237, 212, 0, 0.8],
            }),
        }),
    };

    const vectorLayer = new VectorLayer({
        source: new VectorSource({
            features: [routeFeature],
        }),
        style: function (feature) {
            return styles[feature.get("type")];
        },
    });

    map.addLayer(vectorLayer);
});

function osm_coordinates(lat, lon) {
    return window.ol.proj.fromLonLat([lon, lat]);
}

function get_points() {
    // switch to http://localhost:8888/request-data for development
    $.getJSON("http://localhost:8888/request-data?secret=" + password, function (data) {
        console.log("Datapoints could be loaded");
        toastr.success("Neue Daten geladen");

        points = data;
    }).fail(function () {
        console.error("Could not load JSON");
        toastr.error("Falsches Passwort oder Fehler");
    });
}
