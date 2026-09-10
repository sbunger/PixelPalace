const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const closeBtn = document.querySelector(".close");
const popupCaption = document.getElementById("popup-caption");
const leftArrow = document.querySelector(".arrow.left");
const rightArrow = document.querySelector(".arrow.right");

let currentImageIndex = 0;
let images = [];

function updateLightbox() {
    images = Array.from(document.querySelectorAll(".lightbox"));

    images.forEach((img, index) => {
        img.onclick = () => {
            showImage(index);
            popup.classList.add("shown");
        };
    });
}

function showImage(index) {
    const img = images[index];

    if (!img) return;

    popupImg.src = img.src;

    if (img.dataset.caption) {
        popupCaption.style.display = "block";
        popupCaption.textContent = img.dataset.caption;
    } else {
        popupCaption.style.display = "none";
    }

    currentImageIndex = index;
}

rightArrow.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!images.length) return;

    showImage((currentImageIndex + 1) % images.length);
});

leftArrow.addEventListener("click", (e) => {
    e.stopPropagation();

    if (!images.length) return;

    showImage((currentImageIndex - 1 + images.length) % images.length);
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
    if (!images.length) return;

    if (e.key === "ArrowRight") {
        showImage((currentImageIndex + 1) % images.length);
    }

    if (e.key === "ArrowLeft") {
        showImage((currentImageIndex - 1 + images.length) % images.length);
    }

    if (e.key === "Escape") {
        popup.classList.remove("shown");
    }
});