const projectForm = document.getElementById("project-form");
const projectLinks = document.getElementById("project-links");
const projectImages = document.getElementById("project-images");
const projectStatus = document.getElementById("project-status");
const projectList = document.getElementById("project-list");

document.getElementById("add-link").addEventListener(
    "click",
    () => addLinkRow()
);

document.getElementById("add-image").addEventListener(
    "click",
    () => addImageRow()
);

function addLinkRow(label = "", url = "") {
    const row = document.createElement("div");

    row.className = "dynamic-row";

    const labelInput = document.createElement("input");

    labelInput.type = "text";
    labelInput.placeholder = "label...";
    labelInput.value = label;

    const urlInput = document.createElement("input");

    urlInput.type = "url";
    urlInput.placeholder = "url...";
    urlInput.value = url;

    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.textContent = "X";

    removeButton.addEventListener(
        "click",
        () => row.remove()
    );

    row.append(
        labelInput,
        urlInput,
        removeButton
    );

    projectLinks.appendChild(row);
}

function addImageRow(src = "", caption = "") {
    const row = document.createElement("div");
    row.className = "image-row";

    const uploadContainer = document.createElement("div");
    uploadContainer.className = "image-upload";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp,image/gif";

    uploadContainer.append(fileInput);

    const imageDetails = document.createElement("div");
    imageDetails.className = "image-details";

    const preview = document.createElement("img");
    preview.className = "image-preview";

    if (src) {
        preview.src = src;
    } else {
        preview.classList.add("empty");
    }

    const captionInput = document.createElement("input");
    captionInput.type = "text";
    captionInput.placeholder = "caption...";
    captionInput.value = caption;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "X";

    removeButton.addEventListener("click", () => {
        row.remove();
    });

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];

        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await fetch("/api/projects/upload", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed.");
            }

            row.dataset.src = data.path;
            preview.src = data.path;
            preview.classList.remove("empty");
        } catch (error) {
            console.error(error);
            fileInput.value = "";
        }
    });

    imageDetails.append(
        preview,
        captionInput,
        removeButton
    );

    row.append(
        uploadContainer,
        imageDetails
    );

    if (src) {
        row.dataset.src = src;
    }

    projectImages.appendChild(row);
}

function getLinks() {
    return [...projectLinks.children]
        .map(row => {
            const inputs =
                row.querySelectorAll("input");

            return {
                label: inputs[0].value.trim(),
                url: inputs[1].value.trim()
            };
        })
        .filter(
            link =>
                link.label &&
                link.url
        );
}

function getImages() {
    return [...projectImages.children]
        .map(row => {
            const captionInput =
                row.querySelector(
                    "input[type='text']"
                );

            return {
                src: row.dataset.src || "",
                caption:
                    captionInput.value.trim()
            };
        })
        .filter(image => image.src);
}

projectForm.addEventListener(
    "submit",
    async event => {
        event.preventDefault();

        projectStatus.textContent =
            "Adding project...";

        projectStatus.style.display =
            "block";

        const images =
            getImages();

        const uploadRows =
            [...projectImages.children];

        const stillUploading =
            uploadRows.some(
                row =>
                    row.querySelector(
                        ".upload-status"
                    )?.textContent ===
                    "Uploading..."
            );

        if (stillUploading) {
            projectStatus.textContent =
                "Please wait for the images to finish uploading.";

            return;
        }

        const project = {
            title:
                document.getElementById(
                    "project-title"
                ).value.trim(),

            date:
                document.getElementById(
                    "project-date"
                ).value.trim(),

            description:
                document.getElementById(
                    "project-description"
                ).value.trim(),

            links:
                getLinks(),

            images
        };

        try {
            const response =
                await fetch(
                    "/api/projects",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body:
                            JSON.stringify(
                                project
                            )
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Could not add project."
                );
            }

            projectStatus.textContent =
                "Project added!";

            projectForm.reset();

            projectLinks.innerHTML =
                "";

            projectImages.innerHTML =
                "";

            loadProjects();
        } catch (error) {
            console.error(error);

            projectStatus.textContent =
                error.message;
        }
    }
);

async function loadProjects() {
    try {
        const response =
            await fetch(
                "/api/projects"
            );

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

        projectList.innerHTML =
            "";

        projectStatus.textContent =
            error.message;

        projectStatus.style.display =
            "block";
    }
}

function displayProjects(projects) {
    projectList.innerHTML = "";

    if (projects.length === 0) {
        projectList.innerHTML =
            "<p>No projects yet.</p>";

        return;
    }

    projects.forEach(
        (project, index) => {
            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "admin-project";

            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "admin-project-info";

            const title =
                document.createElement(
                    "h2"
                );

            title.textContent =
                project.title;

            const date =
                document.createElement(
                    "p"
                );

            date.textContent =
                project.date;

            info.append(
                title,
                date
            );

            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "project-actions";

            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.type =
                "button";

            deleteButton.textContent =
                "DELETE";

            deleteButton.addEventListener(
                "click",
                () =>
                    deleteProject(
                        index,
                        project.title
                    )
            );

            actions.appendChild(
                deleteButton
            );

            item.append(
                info,
                actions
            );

            projectList.appendChild(
                item
            );
        }
    );
}

async function deleteProject(
    index,
    title
) {
    const confirmed =
        confirm(
            `Delete "${title}"?`
        );

    if (!confirmed) {
        return;
    }

    projectStatus.textContent =
        "Deleting...";

    projectStatus.style.display =
        "block";

    try {
        const response =
            await fetch(
                `/api/projects/${index}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                "Could not delete project."
            );
        }

        projectStatus.textContent =
            "Project deleted!";

        loadProjects();
    } catch (error) {
        console.error(error);

        projectStatus.textContent =
            error.message;
    }
}

loadProjects();