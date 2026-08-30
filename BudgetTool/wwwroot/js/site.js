// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
const loadingSpinner = document.getElementById("loading-overlay");

function showSpinner() {
    loadingSpinner.classList.remove("loader-hidden");
}

function hideSpinner() {
    loadingSpinner.classList.add("loader-hidden");
}