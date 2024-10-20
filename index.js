const apiURL = 'https://api.binance.com/api/v3/ticker/price';

let startingCapital = 100; // Starting capital of $100
let currentCapital = startingCapital; // Current capital initialized to starting value
const gridParts = 10; // The capital is divided into 10 parts for "grid" trading
const gridCapital = startingCapital / gridParts; // Capital allocated per trade (1/10th of the starting capital)
let previousAssets = null; // Variable to store the previous asset prices for comparison
let portfolio = {}; // Object to track how much of each cryptocurrency has been bought

// Function to fetch asset prices from Binance API
async function getAssets() {
  try {
    const response = await fetch(apiURL); // Request data from the Binance API
    const data = await response.json(); // Parse response as JSON
    const assets = data
      .filter(ticker => ticker.symbol.endsWith('USDT')) // Filter assets to include only USDT trading pairs
      .slice(0, 10) // Select the top 10 assets
      .map(ticker => ({
        symbol: ticker.symbol, // Store the symbol of the asset
        price: parseFloat(ticker.price) // Convert the price to a float
      }));

    return assets; // Return the array of selected assets
  } catch (error) {
    console.error("Error fetching assets:", error); // Log error if fetching fails
    return []; // Return an empty array on failure
  }
}

// Function to compare previous and current prices and calculate percentage change
function comparePrices(previous, current) {
  return previous.map((prevAsset, index) => {
    const currentAsset = current[index];
    const priceDifference = currentAsset.price - prevAsset.price; // Calculate price difference
    const percentageDifference = ((priceDifference / prevAsset.price) * 100).toFixed(4); // Calculate percentage difference

    return {
      symbol: prevAsset.symbol, // Store the symbol
      previousPrice: prevAsset.price, // Store the previous price
      currentPrice: currentAsset.price, // Store the current price
      percentageChange: parseFloat(percentageDifference) // Store the percentage change
    };
  });
}

// Function to buy a cryptocurrency if conditions are met
function buy(symbol, currentPrice) {
  if (currentCapital >= gridCapital) { // Check if there's enough capital to buy
    const quantity = gridCapital / currentPrice; // Calculate how much can be bought
    currentCapital -= gridCapital; // Deduct from the current capital
    portfolio[symbol] = (portfolio[symbol] || 0) + quantity; // Update portfolio with purchased quantity

    console.log(`%c[Bought] ${quantity.toFixed(4)} of ${symbol} at $${currentPrice.toFixed(4)}`, "color: green; font-weight: bold;"); // Log the purchase
  } else {
    console.log(`%c[Insufficient Capital] Unable to buy ${symbol}. Remaining capital: $${currentCapital.toFixed(2)}`, "color: red; font-weight: bold;"); // Log insufficient capital
  }
}

// Function to sell a cryptocurrency if conditions are met
function sell(symbol, currentPrice) {
  const quantity = portfolio[symbol] || 0; // Get the quantity owned

  if (quantity > 0) { // Check if there are assets to sell
    const sellAmount = quantity * currentPrice; // Calculate the amount received from the sale
    currentCapital += sellAmount; // Add to the current capital
    portfolio[symbol] = 0; // Reset the portfolio for the sold asset

    console.log(`%c[Sold] ${quantity.toFixed(4)} of ${symbol} at $${currentPrice.toFixed(4)}`, "color: blue; font-weight: bold;"); // Log the sale
  } else {
    console.log(`%c[No Assets] No ${symbol} to sell.`, "color: gray; font-weight: bold;"); // Log that no assets are available to sell
  }
}

// Function to display the current balance of capital
function showBalance() {
  console.log(`%cCurrent Balance: $${currentCapital.toFixed(2)}`, "color: yellow; font-weight: bold; background-color: black; padding: 2px;"); // Display the balance
}

// Function to display percentage price changes for assets
function displayPercentageChanges(priceComparison) {
  console.log("%cPrice Differences (Percentage Change):", "font-weight: bold; text-decoration: underline;"); // Header for percentage changes
  priceComparison.forEach(asset => {
    const color = asset.percentageChange > 0 ? 'green' : 'red'; // Green for positive, red for negative changes
    console.log(`%c${asset.symbol} | Previous: $${asset.previousPrice.toFixed(4)} | Current: $${asset.currentPrice.toFixed(4)} | Change: ${asset.percentageChange.toFixed(4)}%`, `color: ${color};`); // Display changes for each asset
  });
}

// Main bot function that runs the trading loop
async function runBot() {
  while (true) { // Infinite loop for continuous operation
    if (currentCapital <= 0) { // Stop the bot if capital is depleted
      console.log("%cBot Stopped: Insufficient Capital.", "color: red; font-weight: bold; background-color: yellow; padding: 4px;"); // Log bot stop
      break; // Exit the loop
    }

    const currentAssets = await getAssets(); // Fetch current asset prices

    if (previousAssets) { // Compare prices if previous data exists
      const priceComparison = comparePrices(previousAssets, currentAssets); // Get price differences

      displayPercentageChanges(priceComparison); // Display percentage changes

      priceComparison.forEach(asset => {
        if (asset.percentageChange <= -0.01) { // Buy if percentage change is -0.01% or lower
          buy(asset.symbol, asset.currentPrice);
        }

        if (asset.percentageChange >= 0.01) { // Sell if percentage change is 0.01% or higher
          sell(asset.symbol, asset.currentPrice);
        }
      });
    }

    showBalance(); // Display the current capital balance

    previousAssets = currentAssets; // Store current data for next iteration

    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds before next iteration
  }
}

runBot(); // Start the bot
