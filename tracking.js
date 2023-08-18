let paths = {};
let selected_path_key = "";
let selected_point_index = 0;
let current_location = [0, 0];
let last_reported_location = [0, 0];
let current_distance = 0;

let client_id = Math.floor(Math.random() * 30000);

$(document).ready(() => {
    var geo_options = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 3000,
    };
    error_func = function (error) {
        console.error(error);

        $("#geolocation_works").html("Fehler beim Standortzugriff. Vermutlich Zugriff nicht erteilt.");
        $("#geolocation_works").addClass("status-message-error").removeClass("status-message-works");
    };

    $.getJSON("paths.json", function (data) {
        console.log("Datapoints could be loaded");

        paths = data;

        const selectElement = document.getElementById("select_route");
        for (const path_selector in paths) {
            if (paths.hasOwnProperty(path_selector)) {
                const option = document.createElement("option");
                option.value = path_selector;
                option.text = path_selector;
                selectElement.appendChild(option);
            }
        }

        let stored_select_route = localStorage.getItem("select_route");
        let stored_select_point = localStorage.getItem("select_point");

        if (stored_select_route != undefined && stored_select_route != null) {
            selected_path_key = stored_select_route;
            $("#select_route").val(stored_select_route);
            console.log("Loaded value for select_route");
        }
        set_points_dropdown();
        if (stored_select_point != undefined && stored_select_point != null) {
            set_point(stored_select_point);
            console.log("Loaded value for select_point");
        }

        update_distance_to_target();
    }).fail(function () {
        console.error("Could not load JSON");
    });
    $("#select_route").on("change", function (value) {
        selected_path_key = $("#select_route").val();
        localStorage.setItem("select_route", selected_path_key);

        set_points_dropdown();
        update_distance_to_target();
    });
    $("#select_point").on("change", function (value) {
        set_point(parseInt($("#select_point").val()));

        update_distance_to_target();
    });

    if ("geolocation" in navigator) {
        /* geolocation theoretically available */
        geolocation_success();

        // test once
        navigator.geolocation.getCurrentPosition(
            function (position) {
                geolocation_success();
                console.log(position.coords.latitude, position.coords.longitude);
            },
            error_func,
            geo_options
        );

        // start logging
        navigator.geolocation.watchPosition(
            function (position) {
                geolocation_success();
                console.log(position.coords.latitude, position.coords.longitude);
                if (
                    calculate_distance_in_m(
                        position.coords.latitude,
                        position.coords.longitude,
                        last_reported_location[0],
                        last_reported_location[1]
                    ) > 10
                ) {
                    // track for reporting
                    localStorage.setItem(
                        "geo_" + Date.now(),
                        String(position.coords.latitude) + ", " + String(position.coords.longitude)
                    );

                    last_reported_location = [position.coords.latitude, position.coords.longitude];
                }

                current_location = [position.coords.latitude, position.coords.longitude];

                update_nr_datasets();
                update_distance_to_target();
            },
            error_func,
            geo_options
        );
    } else {
        /* geolocation not available */
        $("#geolocation_works").html("Standortzugriff wird vom Browser nicht unterstützt");
        $("#geolocation_works").addClass("status-message-error").removeClass("status-message-works");
    }

    // start upload cycle
    setInterval(try_uploading_data, 10000);
});

function update_nr_datasets() {
    let keys = Object.keys(localStorage);
    i = keys.length;
    let count = 0;
    while (i--) {
        let key = keys[i];
        if (key.startsWith("geo_")) {
            count++;
        }
    }

    $("#nr_datasets").html(count);
}

function set_points_dropdown() {
    const selectElement = document.getElementById("select_point");
    $(selectElement).empty();
    set_point(0);

    if (selected_path_key != "") {
        for (number = 0; number < paths[selected_path_key].length; number++) {
            const option = document.createElement("option");
            option.value = number;
            option.text = "Punkt Nr." + (number + 1);
            selectElement.appendChild(option);
        }
    }
}

function set_point(index) {
    selected_point_index = index;
    localStorage.setItem("select_point", selected_point_index);
    $("#select_point").val(selected_point_index);
    update_distance_to_target();
}

function get_point() {
    if (selected_path_key == "") {
        return [0, 0];
    }
    return paths[selected_path_key][selected_point_index];
}

function geolocation_success() {
    $("#geolocation_works").html("Standortzugriff funktioniert");
    $("#geolocation_works").addClass("status-message-works").removeClass("status-message-error");
}

function try_uploading_data() {
    let keys_to_treat = [];
    let message = {};

    let keys = Object.keys(localStorage);
    i = keys.length;
    let count = 0;
    while (i--) {
        key = keys[i];

        if (key.startsWith("geo_")) {
            keys_to_treat.push(key);

            let item = localStorage.getItem(key);
            let location = item.replace(" ", "").split(",", 2);
            let time = key.replace("geo_", "");

            message[key] = {
                lat: location[0],
                lon: location[1],
                time: time,
                ident: client_id,
            };

            count++; // avoid payload too large
            if (count > 15) {
                break;
            }
        }
    }

    if (count == 0) {
        return;
    }

    // switch to http://localhost:8888/log-data for development
    jQuery.post("http://localhost:8888/log-data", message, function (data) {
        let worked = data.success && data.success != undefined && data.success != null;

        if (worked) {
            console.log("Data sent to server");
            keys_to_treat.forEach((key) => {
                localStorage.removeItem(key);
            });
        }

        update_nr_datasets();
    });
}

function update_distance_to_target() {
    let target = get_point();
    let dist = calculate_distance_in_m(target[0], target[1], current_location[0], current_location[1]);

    if (isNaN(dist)) {
        dist = 0;
    }

    dist = Math.floor(dist);

    current_distance = dist;
    console.log("distance updated to " + dist);
    $("#current_distance").html(dist);

    if (current_distance < 10) {
        if (paths[selected_path_key].length - 1 > selected_point_index) {
            toastr.success("Zwischen Wegpunkt erreicht!");
            set_point(selected_point_index + 1);
        } else {
            toastr.success("Zielpunkt erreicht!!");
        }
    }
}

// # https://www.movable-type.co.uk/scripts/latlong.html
function calculate_distance_in_m(lat1, lon1, lat2, lon2) {
    console.log(lat1, lon1, lat2, lon2);

    const R = 6371e3; // metres
    const phi1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const phi2 = (lat2 * Math.PI) / 180;
    const delphi = ((lat2 - lat1) * Math.PI) / 180;
    const dellam = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(delphi / 2) * Math.sin(delphi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(dellam / 2) * Math.sin(dellam / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres

    return d;
}
