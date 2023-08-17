let paths = {};
let selected_path_key = "";
let selected_point_index = 0;

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

    $.getJSON("/paths.json", function (data) {
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
            $("#select_point").val(stored_select_point);
            console.log("Loaded value for select_point");
        }
    }).fail(function () {
        console.error("Could not load JSON");
    });
    $("#select_route").on("change", function (value) {
        selected_path_key = $("#select_route").val();
        localStorage.setItem("select_route", selected_path_key);

        set_points_dropdown();
    });
    $("#select_point").on("change", function (value) {
        set_point(parseInt($("#select_point").val()));
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
                localStorage.setItem(
                    "geo_" + Date.now(),
                    String(position.coords.latitude) + ", " + String(position.coords.longitude)
                );

                update_nr_datasets();
            },
            error_func,
            geo_options
        );
    } else {
        /* geolocation not available */
        $("#geolocation_works").html("Standortzugriff wird vom Browser nicht unterstützt");
        $("#geolocation_works").addClass("status-message-error").removeClass("status-message-works");
    }

    // dump
    $("#dump_data").on("click", () => {
        console.log("dump");

        result = "";
        keys = Object.keys(localStorage);
        i = keys.length;
        while (i--) {
            key = keys[i];
            item = localStorage.getItem(key);

            result += key + ", " + item + "\n";
        }

        download("data.csv", result);
    });

    // start upload cycle
    setInterval(try_uploading_data, 1000);
});

function update_nr_datasets() {
    $("#nr_datasets").html(localStorage.length - 2);
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
    console.log("Try Data upload");
}

function calculate_distance_to_target(latitude, longitude) {}
