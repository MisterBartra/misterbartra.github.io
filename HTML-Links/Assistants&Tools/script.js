const scrollContainer = document.getElementById("sectionsContainer");
const sections = document.querySelectorAll("button");
sections[0].addEventListener("click", function () {
    scrollContainer.style.transform = `translateY(-0vh)`;
});
sections[1].addEventListener("click", function () {
    scrollContainer.style.transform = `translateY(-100vh)`;
});
sections[2].addEventListener("click", function () {
    scrollContainer.style.transform = `translateY(-200vh)`;
});
