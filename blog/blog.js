let posts = [];
let postsPerPage = 4;
let currentIndex = 0;

async function loadPosts() {
    const res = await fetch("/blog/posts.json");
    posts = await res.json();

    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    showPosts();
}

function showPosts() {
    const container = document.getElementById("posts");

    const nextBatch = posts.slice(currentIndex, currentIndex + postsPerPage);

    nextBatch.forEach(post => {
        const postDiv = document.createElement("div");
        postDiv.className = "container outline post";

        const headerDiv = document.createElement("div");
        headerDiv.className = "blog-header";

        const title = document.createElement("h2");
        title.textContent = post.title;
        headerDiv.appendChild(title);

        const date = document.createElement("h3");
        date.textContent = new Date(post.date).toLocaleDateString();
        headerDiv.appendChild(date);

        postDiv.appendChild(headerDiv);

        const desc = document.createElement("p");
        desc.style.textAlign = "left";
        desc.textContent = post.description;
        postDiv.appendChild(desc);

        const imgContainer = document.createElement("div");
        imgContainer.className = "img-container";

        // Remove lightbox-related attributes
        post.images.forEach(img => {
            const image = document.createElement("img");
            image.src = img.src;
            imgContainer.appendChild(image);
        });

        postDiv.appendChild(imgContainer);
        container.appendChild(postDiv);
    });

    currentIndex += nextBatch.length;

    const loadMoreBtn = document.getElementById("load-more");
    loadMoreBtn.style.display = currentIndex >= posts.length ? "none" : "block";
}

document.getElementById("load-more").addEventListener("click", showPosts);

loadPosts();