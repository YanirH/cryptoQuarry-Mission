export let selectedCoins = JSON.parse(localStorage.getItem("selectedCoins") || "[]");
(async function () {
    const coinContainer = document.body.querySelector("#coinContainer");
    const searchedCoinContainer = document.body.querySelector("#searchedCoinContainer");
    const chartContainer = document.body.querySelector("#chartContainer");
    const aboutContainer = document.body.querySelector("#aboutContainer");
    const searchInput = document.body.querySelector('#searchInput');
    const homeBtn = document.body.querySelector("#homeBtn");
    const chartBtn = document.body.querySelector("#chartBtn");
    const aboutBtn = document.body.querySelector("#aboutBtn");
    const doneBtn = document.body.querySelector("#doneBtn");
    const searchBtn = document.body.querySelector('#searchBtn');
    let coinsArray = await getCoins();
    async function getCoins() {
        let cachedCoins = localStorage.getItem("coins");
        if (cachedCoins) {
            return JSON.parse(cachedCoins);
        }
        else {
            let response = await fetch("https://api.coingecko.com/api/v3/coins/list");
            let data = await response.json();
            localStorage.setItem("coins", JSON.stringify(data.slice(0, 100)));
            return data;
        }
    }
    async function getSpecificCoin(coinId) {
        let cachedData = localStorage.getItem(`coinData-${coinId}`);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        else {
            let response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
            let data = await response.json();
            localStorage.setItem(`coinData-${coinId}`, JSON.stringify(data)); // Cache fetched coin data
            return data;
        }
    }
    function saveSelectedCoins() {
        localStorage.setItem("selectedCoins", JSON.stringify(selectedCoins));
    }
    function createCoinCard(coin) {
        let card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
    <div class="card" style="width: 18rem;">
        <div class="card-body">
            <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" 
                       id="switch${coin.id}" data-coin-id="${coin.id}"
                       ${selectedCoins.includes(coin.id) ? "checked" : ""}>
            </div>
            <h5 class="card-title">${coin.symbol}</h5>
            <p class="card-text">${coin.name}</p>
            <p class="d-inline-flex gap-1">
                <button class="btn btn-primary" type="button" data-bs-toggle="collapse" 
                        data-bs-target="#id${coin.id}" aria-expanded="false" 
                        aria-controls="id${coin.id}">More Info</button>
            </p>
        </div>
        <div class="collapse" id="id${coin.id}"></div>
    </div>
`;
        const switchBtn = card.querySelector("input");
        const moreInfoBtn = card.querySelector("button");
        const collapseDiv = card.querySelector(`#id${coin.id}`);
        moreInfoBtn.addEventListener("click", async () => {
            if (collapseDiv.innerHTML === "") {
                let coinDetails = await getSpecificCoin(coin.id);
                collapseDiv.innerHTML = `<img src="${coinDetails.image.thumb}" alt="${coinDetails.name}">
                                         <p>$${coinDetails.market_data.current_price.usd} USD</p>
                                         <p>€${coinDetails.market_data.current_price.eur} EUR</p>
                                         <p>${coinDetails.market_data.current_price.ils} ILS</p>`;
                moreInfoBtn.textContent = "Hide Info";
            }
            else {
                collapseDiv.innerHTML = "";
                moreInfoBtn.textContent = "More Info";
            }
        });
        switchBtn.addEventListener("change", () => {
            if (switchBtn.checked) {
                if (selectedCoins.length >= 5) {
                    switchBtn.checked = false; // Uncheck newly checked box if limit exceeded
                    checkLimitAndShowModal();
                }
                else {
                    selectedCoins.push(coin.id);
                    saveSelectedCoins();
                }
            }
            else {
                selectedCoins = selectedCoins.filter((id) => id !== coin.id);
                saveSelectedCoins();
            }
        });
        return card;
    }
    function appendCoinsCards(coins, container) {
        coins
            .slice(0, 100) //sets how many coins to be displayed 
            .forEach((coin) => container.appendChild(createCoinCard(coin))); // using the createCoinCard function to append the coins
    }
    function toggleSection(activeSectionId) {
        const sections = {
            home: { container: coinContainer, button: homeBtn },
            chart: { container: chartContainer, button: chartBtn },
            about: { container: aboutContainer, button: aboutBtn },
        };
        Object.entries(sections).forEach(([sectionId, { container, button }]) => {
            if (sectionId === activeSectionId) {
                container.style.display = sectionId === "home" ? "flex" : "block";
                button.classList.add("active");
            }
            else {
                container.style.display = "none";
                button.classList.remove("active");
            }
        });
    }
    function updateModal() {
        const modalList = document.getElementById("selectedCoinsList");
        modalList.innerHTML = "";
        selectedCoins.forEach((coinId) => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item");
            const textSpan = document.createElement("span");
            textSpan.textContent = coinId;
            listItem.appendChild(textSpan);
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.classList.add("btn", "btn-danger", "btn-sm");
            removeBtn.onclick = () => {
                selectedCoins = selectedCoins.filter((id) => id !== coinId);
                saveSelectedCoins();
                updateModal();
                const checkbox = document.querySelector(`input[data-coin-id='${coinId}']`);
                if (checkbox) {
                    checkbox.checked = false;
                }
            };
            listItem.appendChild(removeBtn);
            modalList.appendChild(listItem);
        });
    }
    function checkLimitAndShowModal() {
        if (selectedCoins.length >= 5) {
            const limitModalElement = document.getElementById("limitModal");
            if (limitModalElement) {
                limitModalElement.style.display = "block";
                limitModalElement.classList.add("show");
                limitModalElement.setAttribute("aria-modal", "true");
                limitModalElement.setAttribute("role", "dialog");
                limitModalElement.style.background = "rgba(0, 0, 0, 0.5)";
                updateModal();
            }
        }
    }
    function closeModal() {
        const limitModalElement = document.getElementById("limitModal");
        if (limitModalElement) {
            limitModalElement.style.display = "none";
            limitModalElement.classList.remove("show");
            limitModalElement.removeAttribute("aria-modal");
            limitModalElement.removeAttribute("role");
            limitModalElement.style.background = "";
        }
    }
    function searchForCoins() {
        coinContainer.innerHTML = "";
        const searchedCoins = coinsArray.filter((coin) => coin.symbol.toLowerCase().includes(`${searchInput.value}`));
        if (searchedCoins.length === 0)
            coinContainer.innerHTML = "<p>No coins were found, try a different coin, or leave the search bar empty to show all coins.</p>";
        appendCoinsCards(searchedCoins, coinContainer);
    }
    doneBtn.addEventListener("click", () => closeModal());
    homeBtn.addEventListener("click", () => toggleSection("home"));
    chartBtn.addEventListener("click", () => toggleSection("chart"));
    aboutBtn.addEventListener("click", () => toggleSection("about"));
    searchBtn.addEventListener("click", () => searchForCoins());
    appendCoinsCards(coinsArray, coinContainer);
})();
