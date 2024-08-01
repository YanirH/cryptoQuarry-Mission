import { selectedCoins } from "./index.js";

const chartBtn = document.querySelector('#chartBtn')


let chart = new CanvasJS.Chart("chartContainer", {
    title: {
        text: "Cryptocurrency Prices"
    },
    axisX: {
        title: "Time",
        valueFormatString: "HH:mm:ss"
    },
    axisY: {
        title: "Price in USD",
    },
    toolTip: {
        shared: true,
        contentFormatter: function (e) {
            // e.entries contains all active data points
            let content = ""
            e.entries.forEach((entry) => {
                 content += `${entry.dataSeries.name}: $${entry.dataPoint.y}<br/>`;
            });
            return content;
            
        }
    },
    data: selectedCoins.map(coin => ({
        type: "spline",
        name: coin,
        showInLegend: true,
        dataPoints: []
    }))
});

chart.render();

function updateChartData() {
    if (!selectedCoins.length) {
        return; 
    }
    const symbols = selectedCoins.join(',').toUpperCase(); 
    const apiUrl = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=USD`;


    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response error');
            }
            return response.json();
        })
        .then(data => {
            const currentTime = new Date();
            selectedCoins.forEach(coin => {
                const upperCoin = coin.toUpperCase();
                const series = chart.options.data.find(s => s.name.toUpperCase() === upperCoin);
                if (data[upperCoin] && data[upperCoin]['USD']) {
                    series.dataPoints.push({
                        x: currentTime,
                        y: data[upperCoin]['USD']
                    });
                    if (series.dataPoints.length > 20) {
                        series.dataPoints.shift(); 
                    }
                } else {
                    //if no data
                }
            });
            chart.render();
        })
        .catch(error => {
           // if error
        });
}

function resetChartData() {
    chart.options.data.forEach(series => {
        series.dataPoints = []; // Clear data points for each series
    });
    chart.render(); // Re-render the chart to update the view
}

chartBtn.addEventListener('click', () => resetChartData())

setInterval(updateChartData, 2000); // Update chart data every 2 seconds

