const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const images = document.querySelectorAll(".lightbox");
const closeBtn = document.querySelector(".close");
const popupCaption = document.getElementById("popup-caption");

const leftArrow = document.querySelector(".arrow.left");
const rightArrow = document.querySelector(".arrow.right");

let currentIndex = 0;

function showImage(index) {
    const img = images[index];

    popupImg.src = img.src;

    if (img.getAttribute("data-caption")) {
        popupCaption.style.display = "block";
        popupCaption.innerHTML = img.getAttribute("data-caption");
    } else {
        popupCaption.style.display = "none";
    }
}

images.forEach((img, index) => {
    img.addEventListener("click", () => {
        currentIndex = index;
        showImage(currentIndex);
        popup.classList.add("shown");
    });
});

rightArrow.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % images.length;
    showImage(currentIndex);
});

leftArrow.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(currentIndex);
});

closeBtn.addEventListener("click", () => {
    popup.classList.remove("shown");
});

popup.addEventListener("click", (e) => {
    if (e.target === popup) {
        popup.classList.remove("shown");
    }
});

document.addEventListener("keydown", (e) => {
    if (!popup.classList.contains("shown")) return;

    if (e.key === "ArrowRight") {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    }

    if (e.key === "ArrowLeft") {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    }

    if (e.key === "Escape") {
        popup.classList.remove("shown");
    }
});