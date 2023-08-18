if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("serviceworker.js");
}

let secret_counter = 0;

$(document).ready(() => {
    $("#update_app_button").on("click", function () {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then(async function (registrations) {
                for (let registration of registrations) {
                    await registration.update();
                    await registration.unregister(); // only updating doesn't seem to work. I probably misunderstand the docs
                    console.log("Updated and unregistered old service worker. Reload should install the new one");
                }

                // clear service worker cache
                await caches.delete("pwa-assets");

                // notify
                console.log("Cleared cache and updated app.");

                // hard reload with cache clear
                location.reload(true);
            });
        }
    });

    $("#secret").on("click", function () {
        secret_counter++;
        if (secret_counter > 9) {
            window.location.href = "secret.html";
        }
    });

    console.log("Main js finished executing");
});
