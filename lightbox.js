const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const images = document.querySelectorAll(".lightbox");
const closeBtn = document.querySelector(".close");
const popupCaption = document.getElementById("popup-caption");

images.forEach(img => {
    img.addEventListener("click", () => {
        if (img.getAttribute("data-caption")) {
            popupCaption.style.display = "block";
            popupCaption.textContent = img.getAttribute("data-caption");
        } else {
            popupCaption.style.display = "none";
        }

        popupImg.src = img.src;
        popup.classList.add("shown");
    });
});

closeBtn.addEventListener("click", () => {
    popup.classList.remove("shown");
});

popup.addEventListener("click", (e) => {
    if (e.target === popup) {
        popup.classList.remove("shown");
    }
});