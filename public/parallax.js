
const planets = document.querySelectorAll(".planet-wrap");

function updateParallax() {
    const scrollY = window.scrollY;

    planets.forEach((planet) => {
        if (window.innerWidth <= 600) {
            planet.style.removeProperty("--parallax-y");
            return;
        }

        const speed = -0.23;
        const offset = scrollY * speed;

        planet.style.setProperty(
            "--parallax-y",
            `${offset}px`
        );
    });
}

window.addEventListener("scroll", updateParallax, {
    passive: true
});

window.addEventListener("resize", updateParallax);

updateParallax();

const parallax = document.querySelector('.parallax-bg');
const speed = 0.3;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    parallax.style.backgroundPositionY = `${- (scrollY * speed)}px`;
});