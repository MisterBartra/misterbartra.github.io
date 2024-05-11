const framesMachine = document.getElementById("iframesMachine");
function getAndSetMachine() {
	framesMachine.addEventListener("load", function () { document.title = framesMachine.contentDocument.title || ""; });
    // Asigna la variable al iframe
    return window.onload = function() { framesMachine.contentWindow.urlRowIframes = urlRowIframes; }
}