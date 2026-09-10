async function loadProjects() {
    try {
        const response =
            await fetch("/api/projects");

        if (!response.ok) {
            throw new Error(
                "Could not load projects."
            );
        }

        const projects =
            await response.json();

        displayProjects(projects);
    } catch (error) {
        console.error(error);
    }
}

function displayProjects(projects) {
    const container =
        document.getElementById("projects");

    container.innerHTML = "";

    projects.forEach((project, index) => {
        const projectElement =
            document.createElement("div");

        projectElement.className =
            "container outline project";

        const demoContainer =
            document.createElement("div");

        demoContainer.className =
            "democontainer";

        const title =
            document.createElement("h2");

        title.textContent =
            project.title;

        const links =
            document.createElement("div");

        links.className =
            "demotextcont";

        project.links.forEach((link) => {
            const paragraph =
                document.createElement("p");

            const anchor =
                document.createElement("a");

            anchor.href =
                link.url;

            anchor.target =
                "_blank";

            anchor.rel =
                "noopener noreferrer";

            anchor.textContent =
                link.label;

            paragraph.appendChild(anchor);
            links.appendChild(paragraph);
        });

        demoContainer.append(
            title,
            links
        );

        const date =
            document.createElement("h3");

        date.textContent =
            project.date;

        const description =
            document.createElement("p");

        description.textContent =
            project.description;

        projectElement.append(
            demoContainer,
            date,
            description
        );

        if (project.images?.length) {
            const imageContainer =
                document.createElement("div");

            imageContainer.className =
                "img-container";

            project.images.forEach((imageData) => {
                const image =
                    document.createElement("img");

                image.className =
                    "lightbox";

                image.src =
                    imageData.src;

                image.dataset.caption =
                    imageData.caption || "";

                imageContainer.appendChild(
                    image
                );
            });

            projectElement.appendChild(
                imageContainer
            );
        }

        container.appendChild(
            projectElement
        );

        if (
            index <
            projects.length - 1
        ) {
            const divider =
                document.createElement("img");

            divider.className =
                "center";

            divider.src =
                "/images/frames/divider1.png";

            container.appendChild(
                divider
            );
        }
    });

    updateLightbox();
}

loadProjects();