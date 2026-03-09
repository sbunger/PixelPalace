const bg = document.querySelector(".app");
const radius = 200;

function updateMask(x, y) {
  const gradient =
    `radial-gradient(circle ${radius}px at ${x}px ${y}px, black 0%, transparent 100%)`;

  bg.style.maskImage = gradient;
  bg.style.webkitMaskImage = gradient;
}

document.addEventListener("mousemove", (e) => {
  updateMask(e.clientX, e.clientY);
});

/* hide completely when mouse leaves */
document.addEventListener("mouseleave", () => {
  const hidden =
    `radial-gradient(circle 0px at 0 0, transparent 0, transparent 100%)`;

  bg.style.maskImage = hidden;
  bg.style.webkitMaskImage = hidden;
});