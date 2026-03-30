const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const closeBtn = document.querySelector(".close");
const popupCaption = document.getElementById("popup-caption");
const leftArrow = document.querySelector(".arrow.left");
const rightArrow = document.querySelector(".arrow.right");

let currentImageIndex = 0;
// Cache all images on page load
const images = Array.from(document.querySelectorAll(".lightbox"));

// Show the image at a given index
function showImage(index) {
    const img = images[index];
    if (!img) return; // safety check

    popupImg.src = img.src;
    if (img.dataset.caption) {
        popupCaption.style.display = "block";
        popupCaption.innerHTML = img.dataset.caption;
    } else {
        popupCaption.style.display = "none";
    }

    currentImageIndex = index;
}

// Open popup on image click
images.forEach((img, index) => {
    img.addEventListener("click", () => {
        showImage(index);
        popup.classList.add("shown");
    });
});

// Arrows
rightArrow.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!images.length) return;
    currentImageIndex = (currentImageIndex + 1) % images.length;
    showImage(currentImageIndex);
});

leftArrow.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!images.length) return;
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    showImage(currentImageIndex);
});

// Close popup
closeBtn.addEventListener("click", () => popup.classList.remove("shown"));
popup.addEventListener("click", e => {
    if (e.target === popup) popup.classList.remove("shown");
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
    if (!popup.classList.contains("shown")) return;
    if (!images.length) return;

    if (e.key === "ArrowRight") showImage((currentImageIndex + 1) % images.length);
    if (e.key === "ArrowLeft") showImage((currentImageIndex - 1 + images.length) % images.length);
    if (e.key === "Escape") popup.classList.remove("shown");
});