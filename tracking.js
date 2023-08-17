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

    if ("geolocation" in navigator) {
        /* geolocation theoretically available */
        $("#geolocation_works").html("Standortzugriff funktioniert");
        $("#geolocation_works").addClass("status-message-works").removeClass("status-message-error");

        // test once
        navigator.geolocation.getCurrentPosition(
            function (position) {
                console.log(position.coords.latitude, position.coords.longitude);
            },
            error_func,
            geo_options
        );

        // start logging
        navigator.geolocation.watchPosition(
            function (position) {
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
});

function update_nr_datasets() {
    $("#nr_datasets").html(localStorage.length);
}
