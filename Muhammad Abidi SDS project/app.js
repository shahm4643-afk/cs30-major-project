const nextDom = document.querySelector(".arrows .next");
const prevDom = document.querySelector(".arrows .prev");
const sliderDom = document.querySelector(".circuits .list");
const thumbnailDom = document.querySelector(".circuits .thumbnail");
const circuitsDom = document.querySelector(".circuits");

const timeRunning = 1500;
let runTimeOut;

nextDom.onclick = function () {
    showSlider("next");
};

prevDom.onclick = function () {
    showSlider("prev");
};

function showSlider(type) {

    let sliderItems = sliderDom.querySelectorAll(".item");
    let thumbnailItems = thumbnailDom.querySelectorAll(".item");

    if (type === "next") {
        sliderDom.appendChild(sliderItems[0]);
        thumbnailDom.appendChild(thumbnailItems[0]);
        circuitsDom.classList.add("next");
    } else {
        sliderDom.prepend(sliderItems[sliderItems.length - 1]);
        thumbnailDom.prepend(thumbnailItems[thumbnailItems.length - 1]);
        circuitsDom.classList.add("prev");
    }

    clearTimeout(runTimeOut);

    runTimeOut = setTimeout(() => {
        circuitsDom.classList.remove("next");
        circuitsDom.classList.remove("prev");
    }, timeRunning);
}

// Followed a tutorial line by line